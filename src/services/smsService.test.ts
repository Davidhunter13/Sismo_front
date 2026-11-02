// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { Contact, LocationSnapshot, MedicalInfo } from '../types';
import { buildAlertMessage, buildSafeMessage, buildSmsUrl, medicalSummary } from './smsService';

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
    const msg = buildAlertMessage('Ana', 'sismo', real, { label: 'Parque', latitude: 4.6, longitude: -74 }, medical, 23);
    expect(msg).toContain('Punto de encuentro: Parque https://maps.google.com/?q=4.60000,-74.00000');
    expect(msg).toContain('Info médica: Sangre O+. Alergias: Penicilina');
    expect(msg).toContain('Batería: 23 %');
  });

  it('no incluye la ficha médica si el usuario desactivó «Compartir»', () => {
    const msg = buildAlertMessage('Ana', 'sismo', real, null, { ...medical, showOnAlert: false });
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

describe('buildSmsUrl', () => {
  it('normaliza teléfonos, une destinatarios con coma y codifica el texto', () => {
    const url = buildSmsUrl([contact('+57 300 123 4567'), contact('(601) 555-12-34')], 'Hola & adiós');
    expect(url).toBe('sms:+573001234567,6015551234?body=Hola%20%26%20adi%C3%B3s');
  });
});
