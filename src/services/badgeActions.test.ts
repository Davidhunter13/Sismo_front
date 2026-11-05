// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { AlertRecord, AppData, Contact } from '../types';
import { badgeActionsFromDiff } from './badgeActions';
import { createEmptyData } from './storageService';

const today = new Date(2026, 10, 5);
const contact = (id: string, extra: Partial<Contact> = {}): Contact => ({
  id, name: 'Ana Demo', relationship: 'Hermana', phone: '3000000000', email: 'ana@example.com', isSeed: false, createdAt: '2026-11-01T10:00:00Z', ...extra,
});
const withData = (patch: Partial<AppData>): AppData => ({ ...createEmptyData(), ...patch });

describe('badgeActionsFromDiff', () => {
  it('contacto nuevo, contacto principal y punto de encuentro', () => {
    const next = withData({ contacts: [contact('c1', { emailPrimary: true })], meetingPoints: [{ id: 'p1', label: 'Parque', latitude: 1, longitude: 2 }] });
    expect(badgeActionsFromDiff(createEmptyData(), next, today)).toEqual([
      { clave: 'contacto_agregado', elemento: 'c1' },
      { clave: 'contacto_principal' },
      { clave: 'punto_encuentro', elemento: 'p1' },
    ]);
  });

  it('los contactos de demostración no cuentan', () => {
    expect(badgeActionsFromDiff(createEmptyData(), withData({ contacts: [contact('d', { isSeed: true })] }), today)).toEqual([]);
  });

  it('mochila: elemento marcado, completa y revisada', () => {
    const prev = withData({ kit: { items: [{ id: 'agua', name: 'Agua', checked: false, isDefault: true }] } });
    const next = withData({ kit: { items: [{ id: 'agua', name: 'Agua', checked: true, isDefault: true }], lastReviewedAt: '2026-11-05T10:00:00Z' } });
    expect(badgeActionsFromDiff(prev, next, today).map((a) => a.clave)).toEqual(['mochila_item', 'mochila_completa', 'mochila_revisada']);
  });

  it('ajustes: idioma, tema, alto contraste, caídas y ahorro de batería (solo al activarlos)', () => {
    const base = createEmptyData();
    const prev = { ...base, settings: { ...base.settings, lowBatterySaver: 0 } };
    const next = { ...prev, settings: { ...prev.settings, language: 'en' as const, theme: 'oscuro' as const, highContrast: true, fallDetection: true, lowBatterySaver: 15 } };
    expect(badgeActionsFromDiff(prev, next, today).map((a) => a.clave)).toEqual(['cambiar_idioma', 'cambiar_tema', 'alto_contraste', 'deteccion_caidas', 'ahorro_bateria']);
    expect(badgeActionsFromDiff(next, prev, today).map((a) => a.clave)).toEqual(['cambiar_idioma', 'cambiar_tema']);
  });

  it('ficha médica, encuesta y pasos de «Después del sismo» (por id del paso)', () => {
    const alert: AlertRecord = {
      id: 'a1', eventType: 'sismo', status: 'finalizada', activatedAt: '2026-11-05T10:00:00Z', location: null, digitalStatus: 'no_disponible',
      simulatedDelivery: false, contactsCount: 0, isSeed: false, postQuakeDone: ['paso_02'],
    };
    const prev = withData({ alerts: [{ ...alert, postQuakeDone: [] }] });
    const next = withData({
      alerts: [alert],
      medical: { bloodType: 'O+', allergies: '', medications: '', conditions: '', notes: '', showOnAlert: true },
      susResponses: [{ id: 's1', answeredAt: '2026-11-05T10:00:00Z', answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], score: 50 }],
      postQuakeDone: ['paso_01'],
    });
    expect(badgeActionsFromDiff(prev, next, today)).toEqual([
      { clave: 'ficha_medica' },
      { clave: 'encuesta_sus' },
      { clave: 'post_sismo', elemento: 'paso_01' },
      { clave: 'post_sismo', elemento: 'paso_02' },
    ]);
  });

  it('activar o terminar una alerta real no registra nada', () => {
    const alert: AlertRecord = {
      id: 'a1', eventType: 'sismo', status: 'activa', activatedAt: '2026-11-05T10:00:00Z', location: null, digitalStatus: 'no_disponible',
      simulatedDelivery: false, contactsCount: 0, isSeed: false,
    };
    const prev = createEmptyData();
    const active = withData({ alerts: [alert], activeAlertId: 'a1' });
    const ended = withData({ alerts: [{ ...alert, status: 'finalizada' }], activeAlertId: null });
    expect(badgeActionsFromDiff(prev, active, today)).toEqual([]);
    expect(badgeActionsFromDiff(active, ended, today)).toEqual([]);
  });
});
