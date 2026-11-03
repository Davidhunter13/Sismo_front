// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AlertRecord, Contact } from '../types';
import { buildAlertEmail, emailRecipients, sendAlertEmail } from './emailService';

const contact = (patch: Partial<Contact>): Contact => ({
  id: 'c', name: 'Luisa', relationship: 'Familiar', phone: '3203498531', email: 'luisa@example.com', isSeed: false, createdAt: '', ...patch,
});

const alert: AlertRecord = {
  id: 'a1', eventType: 'sismo', status: 'activa', activatedAt: '2026-11-02T10:00:00.000Z',
  location: { latitude: 4.65, longitude: -74.1, accuracy: 12, timestamp: '', source: 'dispositivo' },
  digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 1, isSeed: false,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('emailRecipients', () => {
  it('solo contactos reales con correo', () => {
    const r = emailRecipients([contact({ id: '1' }), contact({ id: '2', isSeed: true }), contact({ id: '3', email: '' }), contact({ id: '4', email: undefined })]);
    expect(r.map((c) => c.id)).toEqual(['1']);
  });
});

describe('buildAlertEmail', () => {
  it('arma asunto, destinatarios, cuerpo y ubicación', () => {
    const req = buildAlertEmail(alert, 'Ana', [contact({})], null, null, 40);
    expect(req.subject).toBe('ALERTA SISMO: Ana necesita ayuda');
    expect(req.recipients).toEqual([{ name: 'Luisa', email: 'luisa@example.com' }]);
    expect(req.body).toContain('ALERTA SISMO: Ana activó una alerta (Sismo).');
    expect(req.body).toContain('Batería: 40 %');
    expect(req.location).toEqual({ latitude: 4.65, longitude: -74.1, accuracy: 12 });
    expect(req.language).toBe('es');
  });
});

describe('sendAlertEmail', () => {
  const req = () => buildAlertEmail(alert, 'Ana', [contact({})], null, null, null);

  it('sin destinatarios no intenta enviar', async () => {
    expect(await sendAlertEmail({ ...req(), recipients: [] })).toBe('sin_destinatarios');
  });

  it('sin servidor configurado no envía nada', async () => {
    vi.stubEnv('VITE_ALERT_EMAIL_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req())).toBe('sin_servidor');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con servidor: POST JSON y «enviado» si responde 2xx', async () => {
    vi.stubEnv('VITE_ALERT_EMAIL_URL', 'https://correo.example.com/alertas');
    const fetchMock = vi.fn(async () => new Response('', { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req())).toBe('enviado');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://correo.example.com/alertas');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body)).recipients[0].email).toBe('luisa@example.com');
  });

  it('4xx: no reintenta y queda «fallido»', async () => {
    vi.stubEnv('VITE_ALERT_EMAIL_URL', 'https://correo.example.com/alertas');
    const fetchMock = vi.fn(async () => new Response('', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendAlertEmail(req())).toBe('fallido');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('error de red: reintenta con espera y luego «fallido»', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_ALERT_EMAIL_URL', 'https://correo.example.com/alertas');
    const fetchMock = vi.fn(async () => {
      throw new TypeError('network');
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = sendAlertEmail(req());
    await vi.runAllTimersAsync();
    expect(await result).toBe('fallido');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
