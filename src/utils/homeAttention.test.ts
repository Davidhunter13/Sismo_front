// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { AlertRecord, AppData } from '../types';
import { homeAttention } from './homeAttention';

const today = new Date('2026-11-05T12:00:00Z');
const base = { kit: null, medical: null, meetingPoints: [], alerts: [] } as unknown as AppData;
const alert = (extra: Partial<AlertRecord>): AlertRecord => ({
  id: 'a', eventType: 'sismo', status: 'finalizada', activatedAt: '2026-11-04T10:00:00Z', endedAt: '2026-11-04T10:30:00Z', location: null,
  digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 1, isSeed: false, ...extra,
});

describe('homeAttention', () => {
  it('sin nada: mochila, ficha, simulacro y brújula quedan pendientes (amarillo)', () => {
    const r = homeAttention(base, 11, today);
    expect([r.kit.level, r.medical, r.drill, r.compass, r.postQuake.level]).toEqual(['pendiente', 'pendiente', 'pendiente', 'pendiente', null]);
    expect(r.kit.empty).toBe(true);
  });

  it('mochila con algo vencido o por vencer: urgente (rojo) con los nombres', () => {
    const d = { ...base, kit: { lastReviewedAt: '2026-11-01T00:00:00Z', items: [
      { id: '1', name: 'Agua', checked: true, expiresOn: '2026-11-01', isDefault: true },
      { id: '2', name: 'Pilas', checked: true, expiresOn: '2026-11-10', isDefault: true },
      { id: '3', name: 'Linterna', checked: true, isDefault: true },
    ] } } as AppData;
    const r = homeAttention(d, 11, today);
    expect(r.kit.level).toBe('urgente');
    expect(r.kit.expired.map((i) => i.name)).toEqual(['Agua']);
    expect(r.kit.expiring.map((i) => i.name)).toEqual(['Pilas']);
  });

  it('todo listo: sin resaltar', () => {
    const d = { ...base, medical: { bloodType: 'O+' }, meetingPoints: [{ id: 'p', label: 'Parque', latitude: 1, longitude: 1 }],
      kit: { lastReviewedAt: '2026-11-01T00:00:00Z', items: [{ id: '1', name: 'Agua', checked: true, isDefault: true }] },
      alerts: [alert({ id: 'd', isDrill: true }), alert({ postQuakeDone: Array.from({ length: 11 }, (_, i) => `paso_${i}`) })] } as unknown as AppData;
    const r = homeAttention(d, 11, today);
    expect([r.kit.level, r.medical, r.drill, r.compass, r.postQuake.level]).toEqual([null, null, null, null, null]);
  });

  it('«Después del sismo» pendiente tras el último sismo real (no simulacro ni otra emergencia)', () => {
    const d = { ...base, alerts: [alert({ postQuakeDone: ['paso_01'] }), alert({ id: 'x', eventType: 'emergencia_general' })] } as AppData;
    const r = homeAttention(d, 11, today);
    expect(r.postQuake).toMatchObject({ level: 'pendiente', done: 1, total: 11 });
    expect(homeAttention({ ...base, alerts: [alert({ isDrill: true })] } as AppData, 11, today).postQuake.level).toBeNull();
    expect(homeAttention({ ...base, alerts: [alert({ status: 'activa', endedAt: undefined })] } as AppData, 11, today).postQuake.level).toBeNull();
  });
});
