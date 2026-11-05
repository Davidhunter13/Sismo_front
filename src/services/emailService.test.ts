// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AlertRecord, Contact } from '../types';
import { buildAlertEmail, emailRecipients, initialEmailKind, locationEmailDue, sendAlertEmail } from './emailService';

const contact = (patch: Partial<Contact>): Contact => ({
  id: 'c', name: 'Luisa', relationship: 'Familiar', phone: '3203498531', email: 'luisa@example.com', isSeed: false, createdAt: '', ...patch,
});

const alert: AlertRecord = {
  id: 'a1', eventType: 'sismo', status: 'activa', activatedAt: '2026-11-02T10:00:00.000Z',
  location: { latitude: 4.65, longitude: -74.1, accuracy: 12, timestamp: '', source: 'dispositivo' },
  digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 1, isSeed: false,
};

const deps = { base: 'https://api.example.com/sismo', token: 't'.repeat(64), syncFirst: async () => undefined };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('emailRecipients', () => {
  it('solo contactos reales con correo', () => {
    const r = emailRecipients([contact({ id: '1' }), contact({ id: '2', isSeed: true }), contact({ id: '3', email: '' }), contact({ id: '4', email: undefined })]);
    expect(r.map((c) => c.id)).toEqual(['1']);
  });
});

describe('buildAlertEmail', () => {
  it('«activó la alarma»: mensaje con ubicación y batería, sin destinatarios (los decide el servidor)', () => {
    const req = buildAlertEmail(alert, 'Ana', [], null, 40);
    expect(req).toMatchObject({ alertId: 'a1', kind: 'alerta', language: 'es' });
    expect(req.message).toContain('ALERTA SISMO: Ana activó una alerta (Sismo).');
    expect(req.message).toContain('Batería: 40 %');
    expect(req).not.toHaveProperty('recipients');
  });

  it('caída sin respuesta: el correo inicial es de tipo «caida» y lo dice en la primera línea', () => {
    const caida = { ...alert, fallNoResponse: true };
    expect(initialEmailKind(caida)).toBe('caida');
    expect(initialEmailKind(alert)).toBe('alerta');
    const req = buildAlertEmail(caida, 'Ana', [], null, null, initialEmailKind(caida));
    expect(req.kind).toBe('caida');
    expect(req.message.split('\n')[0]).toContain('no respondió');
  });

  it('avisos: urgente, atrapado y batería explican qué cambió', () => {
    expect(buildAlertEmail(alert, 'Ana', [], null, null, 'urgente').message).toMatch(/^Ana pidió AYUDA URGENTE/);
    expect(buildAlertEmail(alert, 'Ana', [], null, null, 'atrapado').message).toMatch(/^Ana activó el modo atrapado/);
    expect(buildAlertEmail(alert, 'Ana', [], null, 9, 'bateria').message).toMatch(/^A Ana se le está acabando la batería \(9 %\)/);
  });
});

describe('locationEmailDue (ubicación actualizada por correo)', () => {
  const t0 = Date.parse('2026-11-05T10:00:00Z');
  const last = { latitude: 4.65, longitude: -74.1, at: '2026-11-05T10:00:00Z' };
  it('sin ubicación enviada: toma la actual como punto de partida', () => {
    expect(locationEmailDue(undefined, { latitude: 4.65, longitude: -74.1 }, t0)).toBe('base');
  });
  it('envía si se desplazó 200 m o más y pasaron 15 min', () => {
    expect(locationEmailDue(last, { latitude: 4.653, longitude: -74.1 }, t0 + 16 * 60_000)).toBe('enviar'); // ~333 m
  });
  it('no envía si se movió poco o pasó poco tiempo', () => {
    expect(locationEmailDue(last, { latitude: 4.6505, longitude: -74.1 }, t0 + 60 * 60_000)).toBeNull(); // ~55 m
    expect(locationEmailDue(last, { latitude: 4.66, longitude: -74.1 }, t0 + 5 * 60_000)).toBeNull(); // 5 min
  });
  it('el aviso explica que se desplazó', () => {
    expect(buildAlertEmail(alert, 'Ana', [], null, null, 'ubicacion').message).toMatch(/^Ana se desplazó durante la alerta/);
  });
});

describe('sendAlertEmail', () => {
  const req = () => buildAlertEmail(alert, 'Ana', [], null, null);

  it('sin servidor configurado no envía nada', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req(), { ...deps, base: null })).toBe('sin_servidor');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sube lo pendiente y hace POST al API con el token: «enviado» si responde 2xx', async () => {
    const order: string[] = [];
    const fetchMock = vi.fn(async () => { order.push('fetch'); return new Response('{"ok":true,"para":1,"copia":2}', { status: 200 }); });
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req(), { ...deps, syncFirst: async () => { order.push('sync'); } })).toBe('enviado');
    expect(order).toEqual(['sync', 'fetch']);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.com/sismo/correo_alerta/a1');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${'t'.repeat(64)}`);
    expect(JSON.parse(String(init.body))).toMatchObject({ tipo: 'alerta', idioma: 'es' });
  });

  it('el servidor no encuentra contactos con correo: «sin_destinatarios»', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"sin_destinatarios"}', { status: 422 })));
    expect(await sendAlertEmail(req(), deps)).toBe('sin_destinatarios');
  });

  it('otros 4xx: no reintenta y queda «fallido»', async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":"limite_correos"}', { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req(), deps)).toBe('fallido');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sin token (teléfono sin registrar): «fallido» sin llamar al API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req(), { ...deps, token: null })).toBe('fallido');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('error de red: reintenta con espera y luego «fallido»', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => { throw new TypeError('network'); });
    vi.stubGlobal('fetch', fetchMock);
    const result = sendAlertEmail(req(), deps);
    await vi.runAllTimersAsync();
    expect(await result).toBe('fallido');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
