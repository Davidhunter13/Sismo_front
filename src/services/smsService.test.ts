// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import type { Contact, LocationSnapshot, MedicalInfo } from '../types';
import { buildAlertMessage, buildLowBatteryMessage, buildSafeMessage, buildSmsUrl, buildWhatsappUrl, medicalSummary, normalizePhone, whatsappNumber } from './smsService';

const real: LocationSnapshot = { latitude: 4.65, longitude: -74.1, accuracy: 12.4, timestamp: '2026-11-01T10:00:00Z', source: 'dispositivo' };
const medical: MedicalInfo = { bloodType: 'O+', allergies: 'Penicilina', medications: '', conditions: '', notes: '', showOnAlert: true };
const contact = (phone: string): Contact => ({ id: phone, name: 'X', relationship: 'Familiar', phone, isSeed: false, createdAt: '' });

describe('buildAlertMessage', () => {
  it('incluye tipo de evento, ubicación con precisión y la línea 123', () => {
    const msg = buildAlertMessage('Ana', 'sismo', real);
    expect(msg).toContain('ALERTA SISMO: Ana activó una alerta (Sismo).');
    expect(msg).toContain('Ubicación (±12 m): https://maps.google.com/?q=4.65000,-74.10000');
    expect(msg).toContain('línea 123');
  });

  it('rotula las coordenadas de prueba y avisa si no hay ubicación', () => {
    expect(buildAlertMessage('Ana', 'prueba', { ...real, source: 'prueba' })).toContain('Ubicación de PRUEBA, no es real');
    expect(buildAlertMessage('Ana', 'sismo', null)).toContain('Ubicación no disponible.');
  });

  it('agrega punto de encuentro, ficha médica y batería', () => {
    const msg = buildAlertMessage('Ana', 'sismo', real, [{ id: 'm1', label: 'Parque', latitude: 4.6, longitude: -74 }], medical, 23);
    expect(msg).toContain('Punto de encuentro: Parque https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('Info médica: Sangre O+. Alergias: Penicilina');
    expect(msg).toContain('Batería: 23 %');
  });

  it('no incluye la ficha médica si el usuario desactivó «Compartir»', () => {
    const msg = buildAlertMessage('Ana', 'sismo', real, [], { ...medical, showOnAlert: false });
    expect(msg).not.toContain('Info médica');
  });

  it('usa un nombre genérico si no hay nombre de usuario', () => {
    expect(buildAlertMessage('  ', 'sismo', null)).toContain('Un contacto suyo activó');
  });
});

describe('medicalSummary', () => {
  it('omite los campos vacíos', () => {
    expect(medicalSummary(medical)).toBe('Sangre O+. Alergias: Penicilina');
  });
  it('devuelve vacío sin ficha', () => {
    expect(medicalSummary(null)).toBe('');
  });
});

describe('buildSafeMessage', () => {
  it('con tipo de evento: menciona la alerta finalizada', () => {
    expect(buildSafeMessage('Ana', 'sismo')).toMatch(/^SISMO: Ana está a salvo\. La alerta \(Sismo\) finalizó a las .+\.$/);
  });
  it('sin tipo de evento: aviso desde el panel principal', () => {
    expect(buildSafeMessage('Ana')).toMatch(/^SISMO: Ana está bien\. Aviso enviado a las .+\.$/);
  });
});

describe('whatsappNumber y buildWhatsappUrl', () => {
  it('quita el + y deja el código de país', () => {
    expect(whatsappNumber('+57 320 349 8531')).toBe('573203498531');
  });
  it('agrega 57 a un celular colombiano guardado sin indicativo', () => {
    expect(whatsappNumber('320 349 8531')).toBe('573203498531');
    expect(whatsappNumber('(320) 349-8531')).toBe('573203498531');
  });
  it('no toca números de otros países ni fijos con indicativo', () => {
    expect(whatsappNumber('+1 415 555 0100')).toBe('14155550100');
    expect(whatsappNumber('6015551234')).toBe('6015551234');
  });
  it('arma el enlace wa.me con el texto codificado', () => {
    expect(buildWhatsappUrl(contact('3203498531'), 'Hola & adiós')).toBe('https://wa.me/573203498531?text=Hola%20%26%20adi%C3%B3s');
  });
});

describe('buildSafeMessage completo', () => {
  it('incluye ubicación actual, punto de encuentro y batería', () => {
    const msg = buildSafeMessage('Ana', 'sismo', new Date(), {
      location: real,
      meetingPoints: [{ id: 'm1', label: 'Parque', latitude: 4.6, longitude: -74 }],
      batteryLevel: 40,
    });
    const lines = msg.split('\n');
    expect(lines[0]).toMatch(/^SISMO: Ana está a salvo\./);
    expect(lines[1]).toBe('Ubicación (±12 m): https://maps.google.com/?q=4.65000,-74.10000');
    expect(lines[2]).toBe('Punto de encuentro: Parque https://maps.google.com/?q=4.60000,-74.00000');
    expect(lines[3]).toBe('Batería: 40 %');
  });
  it('sin ubicación lo indica; sin datos extra queda solo la primera línea', () => {
    expect(buildSafeMessage('Ana', undefined, new Date(), { location: null })).toContain('Ubicación no disponible.');
    expect(buildSafeMessage('Ana').split('\n')).toHaveLength(1);
  });
  it('varios puntos de encuentro: una línea con enlace por cada uno', () => {
    const msg = buildSafeMessage('Ana', 'sismo', new Date(), {
      meetingPoints: [
        { id: 'a', label: 'Casa', latitude: 4.6, longitude: -74 },
        { id: 'b', label: 'Trabajo', latitude: 4.7, longitude: -74.05 },
      ],
    });
    expect(msg).toContain('Punto de encuentro: Casa https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('Punto de encuentro: Trabajo https://maps.google.com/?q=4.70000,-74.05000');
  });
});

describe('normalizePhone (SMS)', () => {
  it('agrega +57 a celulares colombianos sin indicativo; respeta el resto', () => {
    expect(normalizePhone('320 349 8531')).toBe('+573203498531');
    expect(normalizePhone('+57 320 349 8531')).toBe('+573203498531');
    expect(normalizePhone('(601) 555-12-34')).toBe('6015551234');
    expect(normalizePhone('+1 415 555 0100')).toBe('+14155550100');
  });
});

describe('buildSmsUrl', () => {
  it('normaliza teléfonos, une destinatarios con coma y codifica el texto', () => {
    const url = buildSmsUrl([contact('+57 300 123 4567'), contact('(601) 555-12-34')], 'Hola & adiós');
    expect(url).toBe('sms:+573001234567,6015551234?body=Hola%20%26%20adi%C3%B3s');
  });
});

describe('en inglés', () => {
  beforeEach(() => setLang('en'));
  afterEach(() => setLang('es'));

  it('SMS de alerta: encabezado SISMO ALERT, ubicación, ficha médica, batería y dial 123', () => {
    const msg = buildAlertMessage('Ana', 'sismo', real, [{ id: 'm1', label: 'Park', latitude: 4.6, longitude: -74 }], medical, 23);
    expect(msg).toContain('SISMO ALERT: Ana triggered an alert (Earthquake).');
    expect(msg).toContain('Location (±12 m): https://maps.google.com/?q=4.65000,-74.10000');
    expect(msg).toContain('Meeting point: Park https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('Medical info: Blood type O+. Allergies: Penicilina');
    expect(msg).toContain('Battery: 23%');
    expect(msg).toContain('dial 123');
    expect(msg).not.toContain('ALERTA SISMO');
    expect(buildAlertMessage(' ', 'prueba', null)).toContain('One of your contacts triggered an alert (System test).');
  });

  it('«Estoy bien» con y sin tipo de evento', () => {
    expect(buildSafeMessage('Ana', 'sismo')).toMatch(/^SISMO: Ana is safe\. The alert \(Earthquake\) ended at .+\.$/);
    expect(buildSafeMessage('')).toMatch(/^SISMO: Your contact is OK\. Notice sent at .+\.$/);
  });

  it('«Estoy bien» completo en inglés', () => {
    const msg = buildSafeMessage('Ana', undefined, new Date(), { location: real, meetingPoints: [{ id: 'm1', label: 'Park', latitude: 4.6, longitude: -74 }], batteryLevel: 40 });
    expect(msg).toContain('Location (±12 m): https://maps.google.com/?q=4.65000,-74.10000');
    expect(msg).toContain('Meeting point: Park https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('Battery: 40%');
  });
});

describe('buildLowBatteryMessage', () => {
  it('nivel, última ubicación, puntos de encuentro y línea 123', () => {
    const msg = buildLowBatteryMessage('Ana', 18, real, [{ id: 'a', label: 'Casa', latitude: 4.6, longitude: -74 }]);
    expect(msg).toContain('SISMO: Ana sigue en emergencia y su batería está al 18 %.');
    expect(msg).toContain('Ubicación (±12 m): https://maps.google.com/?q=4.65000,-74.10000');
    expect(msg).toContain('Punto de encuentro: Casa https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('línea 123');
  });
});
