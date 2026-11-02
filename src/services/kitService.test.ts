// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { EmergencyKit } from '../types';
import { createDefaultKit, daysUntil, DEFAULT_KIT_ITEMS, kitStatus } from './kitService';

const today = new Date(2026, 10, 2); // 2 de noviembre de 2026 (mes base 0)

describe('daysUntil', () => {
  it('cuenta días por fecha local', () => {
    expect(daysUntil('2026-11-02', today)).toBe(0);
    expect(daysUntil('2026-11-12', today)).toBe(10);
    expect(daysUntil('2026-10-31', today)).toBe(-2);
  });
});

describe('kitStatus', () => {
  const kit: EmergencyKit = {
    lastReviewedAt: new Date(2026, 9, 1).toISOString(),
    items: [
      { id: '1', name: 'Agua', checked: true, expiresOn: '2026-10-01', isDefault: true },
      { id: '2', name: 'Pilas', checked: true, expiresOn: '2026-11-20', isDefault: true },
      { id: '3', name: 'Radio', checked: false, expiresOn: '2027-06-01', isDefault: true },
      { id: '4', name: 'Silbato', checked: false, isDefault: true },
    ],
  };

  it('clasifica vencidos y por vencer (≤ 30 días)', () => {
    const s = kitStatus(kit, today);
    expect(s.expired.map((i) => i.name)).toEqual(['Agua']);
    expect(s.expiringSoon.map((i) => i.name)).toEqual(['Pilas']);
    expect(s.checked).toBe(2);
    expect(s.total).toBe(4);
  });

  it('pide revisión si nunca se revisó o pasaron más de 6 meses', () => {
    expect(kitStatus(kit, today).reviewDue).toBe(false);
    expect(kitStatus({ ...kit, lastReviewedAt: undefined }, today).reviewDue).toBe(true);
    expect(kitStatus({ ...kit, lastReviewedAt: new Date(2026, 0, 1).toISOString() }, today).reviewDue).toBe(true);
  });

  it('lista base con todos los elementos sin marcar', () => {
    const k = createDefaultKit();
    expect(k.items).toHaveLength(DEFAULT_KIT_ITEMS.length);
    expect(k.items.every((i) => !i.checked && i.isDefault)).toBe(true);
  });
});
