// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __setBadgeDepsForTests, BATCH_SIZE, cachedBadges, closestPending, dismissNotice, drillMinutes, fetchBadges, flushBadges, latestEarned, loadQueue,
  pendingNotices, recordAction, recordOpen, enqueueNotices, forgetBadges, markAllNoticesAsNew, markSeen, newBadgeIds, type BadgesResponse, type EarnedBadge,
} from './badgeService';

const badge = (id: number, extra: Partial<EarnedBadge> = {}): EarnedBadge => ({
  id, nivel: 'bronce', familia: 'preparacion', secreta: false, nombre: `Insignia ${id}`, descripcion: 'Demo', imagen: 'https://img.test/b.png',
  regla: 'Hacer algo', obtenida: '2026-11-01T10:00:00Z', vence: null, ...extra,
});

const reply = (extra: Partial<BadgesResponse> = {}): BadgesResponse => ({
  ganadas: [], por_ganar: [], secretas: [], vencidas: [], nuevas: [], perfil: null, total: 100, ...extra,
});

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('cola de insignias', () => {
  let store: Record<string, string>;
  let now: number;
  let online: boolean;
  let token: string | null;

  beforeEach(() => {
    store = {};
    now = new Date('2026-11-05T15:00:00Z').getTime();
    online = true;
    token = 't'.repeat(64);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    __setBadgeDepsForTests({
      base: () => 'https://api.test/sismo',
      token: () => token,
      register: async () => undefined,
      online: () => online,
      now: () => now,
      wait: async () => undefined,
    });
  });

  afterEach(() => {
    __setBadgeDepsForTests(null);
    vi.unstubAllGlobals();
  });

  it('envía en lotes de 50 como máximo y vacía la cola', async () => {
    for (let i = 0; i < 60; i++) recordAction('contacto_agregado', { elemento: `c${i}` });
    expect(loadQueue()).toHaveLength(60);
    const fetchMock = vi.fn(async () => ok(reply()));
    vi.stubGlobal('fetch', fetchMock);
    await flushBadges();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(((c as unknown[])[1] as RequestInit).body as string));
    expect(bodies[0].acciones).toHaveLength(BATCH_SIZE);
    expect(bodies[1].acciones).toHaveLength(10);
    // Formato del contrato, sin el id local de la cola.
    expect(bodies[0].acciones[0]).toEqual({ accion: 'hecho', clave: 'contacto_agregado', elemento: 'c0', momento: '2026-11-05T15:00:00.000Z' });
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe('https://api.test/sismo/insignias');
    expect(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${token}` });
    expect(loadQueue()).toEqual([]);
  });

  it('registra el ingreso como máximo una vez por día', () => {
    recordOpen();
    recordOpen();
    now += 3 * 3_600_000; // mismo día
    recordOpen();
    expect(loadQueue().filter((a) => a.accion === 'ingreso')).toHaveLength(1);
    now += 24 * 3_600_000; // día siguiente
    recordOpen();
    expect(loadQueue().filter((a) => a.accion === 'ingreso')).toHaveLength(2);
  });

  it('conserva la cola si falla la red, el servidor (5xx) o no hay token, y la envía después', async () => {
    recordAction('ver_sismos');
    recordAction('simulacro', { valor: 3 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('sin red'); }));
    await flushBadges();
    expect(loadQueue()).toHaveLength(2);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    await flushBadges();
    expect(loadQueue()).toHaveLength(2);

    token = null;
    const fetchMock = vi.fn(async () => ok(reply()));
    vi.stubGlobal('fetch', fetchMock);
    await flushBadges();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loadQueue()).toHaveLength(2);

    online = false;
    token = 'x'.repeat(64);
    await flushBadges();
    expect(fetchMock).not.toHaveBeenCalled();

    online = true;
    await flushBadges();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loadQueue()).toEqual([]);
  });

  it('descarta el lote que el servidor rechaza con 422 (reintentarlo no ayuda)', async () => {
    recordAction('ver_guia', { elemento: 'antes' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"dato_invalido"}', { status: 422 })));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await flushBadges();
    expect(loadQueue()).toEqual([]);
  });

  it('el mismo hecho sin valor se guarda como máximo una vez por hora; valida valor y elemento', () => {
    recordAction('ver_historial');
    recordAction('ver_historial');
    recordAction('ver_guia', { elemento: 'antes' });
    recordAction('ver_guia', { elemento: 'durante' });
    recordAction('simulacro', { valor: 9999 });
    recordAction('simulacro', { valor: 2.4 });
    recordAction('no_existe' as never);
    const q = loadQueue();
    expect(q.map((a) => a.clave)).toEqual(['ver_historial', 'ver_guia', 'ver_guia', 'simulacro', 'simulacro']);
    expect(q.filter((a) => a.clave === 'simulacro').map((a) => a.valor)).toEqual([600, 2]);
    now += 3_600_001;
    recordAction('ver_historial');
    expect(loadQueue().filter((a) => a.clave === 'ver_historial')).toHaveLength(2);
  });

  it('no envía acciones de hace más de 30 días (el servidor rechazaría el lote)', async () => {
    recordAction('respaldo');
    now += 31 * 86_400_000;
    recordAction('qr_medico');
    const fetchMock = vi.fn(async () => ok(reply()));
    vi.stubGlobal('fetch', fetchMock);
    await flushBadges();
    const body = JSON.parse(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body as string);
    expect(body.acciones.map((a: { clave: string }) => a.clave)).toEqual(['qr_medico']);
  });

  it('las insignias nuevas pasan a la cola de avisos sin repetirse y la respuesta queda guardada para verla sin red', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(reply({ ganadas: [badge(1)], nuevas: [badge(1)] }))));
    await fetchBadges();
    await fetchBadges();
    expect(pendingNotices().map((b) => b.id)).toEqual([1]);
    expect(cachedBadges()?.ganadas).toHaveLength(1);
    dismissNotice(1);
    expect(pendingNotices()).toEqual([]);

    online = false;
    const offline = await fetchBadges();
    expect(offline.fromCache).toBe(true);
    expect(offline.data?.ganadas[0].nombre).toBe('Insignia 1');
  });

  // Regresión: la página mostraba una copia vieja (Ganadas 2) aunque el servidor ya tenía 7.
  it('una copia vieja guardada SIEMPRE se reemplaza por la respuesta actual del GET', async () => {
    store['sismo:v1:insignias'] = JSON.stringify(reply({ ganadas: [badge(1), badge(2)], total: 100 }));
    const fresh = reply({ ganadas: [1, 2, 3, 4, 5, 6, 7].map((i) => badge(i)), total: 100 });
    const fetchMock = vi.fn(async () => ok(fresh));
    vi.stubGlobal('fetch', fetchMock);
    const r = await fetchBadges();
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/sismo/insignias', expect.objectContaining({ method: 'GET' }));
    expect(r.fromCache).toBe(false);
    expect(r.data?.ganadas).toHaveLength(7);
    expect(cachedBadges()?.ganadas).toHaveLength(7);
  });

  // Regresión: con localStorage lleno (QuotaExceeded) quedaba la copia vieja y la interfaz la mostraba.
  it('si guardar en el teléfono falla, la interfaz usa la respuesta nueva en memoria (no la copia vieja)', async () => {
    store['sismo:v1:insignias'] = JSON.stringify(reply({ ganadas: [badge(1), badge(2)] }));
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        if (k === 'sismo:v1:insignias') throw new DOMException('lleno', 'QuotaExceededError');
        store[k] = v;
      },
      removeItem: (k: string) => { delete store[k]; },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ok(reply({ ganadas: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => badge(i)), nuevas: [badge(9)] }))));
    await fetchBadges();
    await fetchBadges();
    expect(cachedBadges()?.ganadas).toHaveLength(9);
    // La copia vieja se borró antes de intentar escribir: nadie puede volver a leerla.
    expect(store['sismo:v1:insignias']).toBeUndefined();
    expect(pendingNotices().map((b) => b.id)).toEqual([9]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('la respuesta del POST también reemplaza la copia y sus «nuevas» van a los avisos (llegan una sola vez)', async () => {
    store['sismo:v1:insignias'] = JSON.stringify(reply({ ganadas: [badge(1)] }));
    recordAction('foto_perfil');
    vi.stubGlobal('fetch', vi.fn(async () => ok(reply({ ganadas: [badge(1), badge(9)], nuevas: [badge(9)] }))));
    await flushBadges();
    expect(cachedBadges()?.ganadas.map((b) => b.id)).toEqual([1, 9]);
    expect(cachedBadges()?.nuevas).toEqual([]);
    expect(pendingNotices().map((b) => b.id)).toEqual([9]);
    // El GET siguiente ya no las trae (el servidor las marcó como notificadas), pero el aviso sigue en cola.
    vi.stubGlobal('fetch', vi.fn(async () => ok(reply({ ganadas: [badge(1), badge(9)] }))));
    await fetchBadges();
    expect(pendingNotices().map((b) => b.id)).toEqual([9]);
  });

  it('ante un 401 se registra de nuevo y repite con el token nuevo (no se queda con la copia vieja)', async () => {
    const reRegister = vi.fn(async () => { token = 'n'.repeat(64); });
    __setBadgeDepsForTests({ base: () => 'https://api.test/sismo', token: () => token, register: async () => undefined, reRegister, online: () => online, now: () => now, wait: async () => undefined });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      (init?.headers as Record<string, string>).Authorization === `Bearer ${'n'.repeat(64)}` ? ok(reply({ ganadas: [badge(3)] })) : new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await fetchBadges();
    expect(reRegister).toHaveBeenCalledTimes(1);
    expect(r.fromCache).toBe(false);
    expect(r.data?.ganadas.map((b) => b.id)).toEqual([3]);
  });
});

describe('ayudas', () => {
  it('drillMinutes redondea hacia arriba (mínimo 1)', () => {
    expect(drillMinutes(0, 1)).toBe(1);
    expect(drillMinutes(0, 60_000)).toBe(1);
    expect(drillMinutes(0, 60_001)).toBe(2);
    expect(drillMinutes(0, 10_000 * 60_000)).toBe(600);
  });

  it('última ganada y la más cercana a ganar', () => {
    const data = reply({
      ganadas: [badge(1, { obtenida: '2026-10-01T00:00:00Z' }), badge(2, { obtenida: '2026-11-01T00:00:00Z' })],
      por_ganar: [
        { ...badge(3), avance: 1, requerido: 10, hasta: null, dura_dias: null },
        { ...badge(4), avance: 4, requerido: 5, hasta: null, dura_dias: null },
      ],
    });
    expect(latestEarned(data)?.id).toBe(2);
    expect(closestPending(data)?.id).toBe(4);
    expect(latestEarned(null)).toBeNull();
  });
});

describe('insignias «Nueva» (Ver mis insignias)', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    forgetBadges();
  });

  it('las ganadas quedan como «Nueva»; «Ver mis insignias» cierra todos los avisos sin perderlas', () => {
    enqueueNotices([badge(1), badge(2), badge(3)]);
    expect(pendingNotices()).toHaveLength(3);
    expect(newBadgeIds()).toEqual(['1', '2', '3']);
    dismissNotice(1); // vio el primer aviso con «Siguiente»
    markAllNoticesAsNew(); // tocó «Ver mis insignias»
    expect(pendingNotices()).toHaveLength(0);
    expect(newBadgeIds()).toEqual(['1', '2', '3']);
  });

  it('al verlas en la lista se quita la marca', () => {
    enqueueNotices([badge(7), badge(8)]);
    markSeen([7]);
    expect(newBadgeIds()).toEqual(['8']);
    markSeen(['8']);
    expect(newBadgeIds()).toEqual([]);
  });
});
