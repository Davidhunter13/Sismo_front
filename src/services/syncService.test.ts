// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AlertRecord, AppData, Contact } from '../types';
import { createEmptyData } from './storageService';
import { __resetSyncForTests, diffOperations, flush, fullSyncOperations, loadOutbox, mergeOutbox, queueChanges, recoverAccount, deleteAccount } from './syncService';

const contact = (id: string, extra: Partial<Contact> = {}): Contact => ({
  id, name: 'Ana', relationship: 'Hermana', phone: '3001234567', email: 'ana@correo.com', isSeed: false, createdAt: '2026-11-01T10:00:00.000Z', ...extra,
});

const alert = (id: string, extra: Partial<AlertRecord> = {}): AlertRecord => ({
  id, eventType: 'sismo', status: 'finalizada', activatedAt: '2026-11-01T10:00:00.000Z', location: null,
  digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 1, isSeed: false, ...extra,
});

const withData = (patch: Partial<AppData>): AppData => ({ ...createEmptyData(), ...patch });

describe('diffOperations', () => {
  it('crea PUT para nuevos o cambiados y DELETE para eliminados', () => {
    const prev = withData({ contacts: [contact('c1'), contact('c2')] });
    const next = withData({ contacts: [contact('c1', { phone: '3110000000' }), contact('c3')] });
    const ops = diffOperations(prev, next);
    expect(ops.map((o) => `${o.method} ${o.path}`)).toEqual(['PUT contactos/c1', 'PUT contactos/c3', 'DELETE contactos/c2']);
  });

  it('nunca envía datos de demostración', () => {
    const next = withData({ contacts: [contact('demo', { isSeed: true })], alerts: [alert('a-demo', { isSeed: true })] });
    expect(diffOperations(createEmptyData(), next)).toEqual([]);
  });

  it('ficha médica: PUT al guardarla y DELETE al quitarla', () => {
    const medical = { bloodType: 'O+', allergies: '', medications: '', conditions: '', notes: '', showOnAlert: true };
    const conFicha = withData({ medical });
    expect(diffOperations(createEmptyData(), conFicha)).toEqual([{ key: 'ficha_medica', method: 'PUT', path: 'ficha_medica', body: medical }]);
    expect(diffOperations(conFicha, createEmptyData())[0]).toMatchObject({ method: 'DELETE', path: 'ficha_medica' });
  });

  it('sin cambios no hay operaciones', () => {
    const data = withData({ alerts: [alert('a1')] });
    expect(diffOperations(data, { ...data })).toEqual([]);
  });
});

describe('fullSyncOperations', () => {
  it('incluye ajustes y todo el historial existente', () => {
    const data = withData({ alerts: [alert('a1'), alert('a2')], susResponses: [{ id: 's1', answeredAt: '2026-11-01T10:00:00Z', answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], score: 50 }] });
    const keys = fullSyncOperations(data).map((o) => o.key);
    expect(keys).toEqual(['ajustes', 'alertas:a1', 'alertas:a2', 'encuestas:s1']);
  });
});

describe('mergeOutbox', () => {
  it('la operación nueva reemplaza a la pendiente del mismo recurso', () => {
    const merged = mergeOutbox(
      [{ key: 'alertas:a1', method: 'PUT', path: 'alertas/a1', body: 1 }, { key: 'ajustes', method: 'PUT', path: 'ajustes' }],
      [{ key: 'alertas:a1', method: 'PUT', path: 'alertas/a1', body: 2 }],
    );
    expect(merged.map((o) => [o.key, o.body])).toEqual([['ajustes', undefined], ['alertas:a1', 2]]);
  });
});

describe('cola sin red', () => {
  let store: Record<string, string>;
  let online: boolean;

  beforeEach(() => {
    store = { 'sismo:v1:dispositivo': JSON.stringify({ uuid: 'u', token: 'a'.repeat(64) }) };
    online = false;
    __resetSyncForTests();
    vi.stubEnv('VITE_SISMO_API_URL', 'https://api.test/sismo/');
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    vi.stubGlobal('navigator', { get onLine() { return online; }, userAgent: 'test' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('guarda los cambios sin red y los sube en orden al volver la conexión', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const a = createEmptyData();
    const b = withData({ alerts: [alert('a1')] });
    const c = withData({ alerts: [alert('a1', { note: 'en casa' })], contacts: [contact('c1')] });
    queueChanges(a, b);
    queueChanges(b, c);
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
    // La cola quedó persistida (sobrevive a cerrar la app) y fusionada por recurso.
    expect(JSON.parse(store['sismo:v1:outbox']).map((o: { key: string }) => o.key)).toEqual(['contactos:c1', 'alertas:a1']);

    online = true;
    await flush();
    expect(fetchMock.mock.calls.map((call) => (call as unknown[])[0])).toEqual(['https://api.test/sismo/contactos/c1', 'https://api.test/sismo/alertas/a1']);
    expect(JSON.parse(((fetchMock.mock.calls[1] as unknown[])[1] as RequestInit).body as string).note).toBe('en casa');
    expect(loadOutbox()).toEqual([]);
  });

  it('recuperar: adopta el token nuevo, descarga el estado y descarta la cola local', async () => {
    online = true;
    store['sismo:v1:outbox'] = JSON.stringify([{ key: 'ajustes', method: 'PUT', path: 'ajustes' }]);
    const estado = { settings: null, contacts: [contact('c9')], alerts: [], meetingPoints: [], susResponses: [], kit: null, medical: null, lastLocation: null, locationPermission: 'concedido', postQuakeDone: [] };
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('/recuperar')
        ? new Response(JSON.stringify({ uuid_dispositivo: 'nuevo', token: 'b'.repeat(64) }), { status: 200 })
        : new Response(JSON.stringify(estado), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await recoverAccount('abcd-efgh-jkmn');
    expect(result.ok && result.state.contacts[0].id).toBe('c9');
    expect(JSON.parse(store['sismo:v1:dispositivo']).token).toBe('b'.repeat(64));
    expect(loadOutbox()).toEqual([]);
    const estadoInit = (fetchMock.mock.calls[1] as unknown[])[1] as RequestInit;
    expect((estadoInit.headers as Record<string, string>).Authorization).toBe(`Bearer ${'b'.repeat(64)}`);
  });

  it('recuperar con código inválido no toca el registro actual', async () => {
    online = true;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"codigo_invalido"}', { status: 404 })));
    const result = await recoverAccount('XXXX-XXXX-XXXX');
    expect(result).toEqual({ ok: false, reason: 'codigo_invalido' });
    expect(JSON.parse(store['sismo:v1:dispositivo']).token).toBe('a'.repeat(64));
  });

  it('eliminar cuenta: avisa al servidor y olvida token y cola para registrarse de nuevo', async () => {
    online = true;
    store['sismo:v1:outbox'] = JSON.stringify([{ key: 'ajustes', method: 'PUT', path: 'ajustes' }]);
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await deleteAccount()).toBe('ok');
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe('https://api.test/sismo/eliminar_cuenta');
    expect(store['sismo:v1:dispositivo']).toBeUndefined();
    expect(loadOutbox()).toEqual([]);
  });

  it('eliminar cuenta sin red: no borra nada en el teléfono', async () => {
    online = false;
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red'); }));
    expect(await deleteAccount()).toBe('sin_red');
    expect(JSON.parse(store['sismo:v1:dispositivo']).token).toBe('a'.repeat(64));
  });

  it('401 (cuenta borrada o base vaciada): se registra de nuevo de inmediato y sube lo pendiente', async () => {
    online = true;
    const calls: string[] = [];
    let primero = true;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url.replace('https://api.test/sismo/', ''));
      if (url.endsWith('/registro')) return new Response(JSON.stringify({ uuid_dispositivo: 'nuevo', token: 'c'.repeat(64) }), { status: 201 });
      if (primero) { primero = false; return new Response('{}', { status: 401 }); }
      return new Response('{"ok":true}', { status: 200 });
    }));
    queueChanges(createEmptyData(), withData({ contacts: [contact('c1')] }));
    await flush();
    expect(calls[0]).toBe('contactos/c1');
    expect(calls).toContain('registro');
    expect(JSON.parse(store['sismo:v1:dispositivo']).token).toBe('c'.repeat(64));
    expect(loadOutbox()).toEqual([]);
  });
});
