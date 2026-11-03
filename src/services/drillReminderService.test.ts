// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { AlertRecord } from '../types';
import { drillReminder } from './drillReminderService';

const alert = (activatedAt: string, patch: Partial<AlertRecord> = {}): AlertRecord => ({
  id: activatedAt,
  eventType: 'prueba',
  status: 'finalizada',
  activatedAt,
  location: null,
  digitalStatus: 'no_disponible',
  simulatedDelivery: false,
  contactsCount: 0,
  isSeed: false,
  isDrill: true,
  ...patch,
});

const may = new Date(2026, 4, 15); // 15 de mayo (mes base 0)

describe('drillReminder', () => {
  it('sin simulacros: pide hacer uno', () => {
    expect(drillReminder([], may)).toEqual({ daysSinceLast: null, personalDue: true, nationalSoon: false });
  });

  it('usa el simulacro más reciente e ignora alertas reales y de ejemplo', () => {
    const r = drillReminder(
      [
        alert(new Date(2026, 3, 15).toISOString()), // 30 días antes
        alert(new Date(2026, 0, 1).toISOString()),
        alert(new Date(2026, 4, 14).toISOString(), { isDrill: false }),
        alert(new Date(2026, 4, 14).toISOString(), { isSeed: true }),
      ],
      may,
    );
    expect(r.daysSinceLast).toBe(30);
    expect(r.personalDue).toBe(false);
  });

  it('recuerda el simulacro personal a los 90 días', () => {
    expect(drillReminder([alert(new Date(2026, 1, 1).toISOString())], may).personalDue).toBe(true);
  });

  it('avisa del Simulacro Nacional en septiembre y octubre', () => {
    expect(drillReminder([], new Date(2026, 8, 10)).nationalSoon).toBe(true);
    expect(drillReminder([], new Date(2026, 9, 20)).nationalSoon).toBe(true);
    expect(drillReminder([], new Date(2026, 10, 1)).nationalSoon).toBe(false);
  });
});
