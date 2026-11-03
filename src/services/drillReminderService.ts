// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AlertRecord } from '../types';

/**
 * Recordatorios de simulacro (dentro de la app):
 * - Simulacro personal: si no se ha hecho uno en DRILL_EVERY_DAYS días.
 * - Simulacro Nacional de Respuesta a Emergencias (Colombia): se realiza cada año en octubre; la fecha
 *   exacta la publica la UNGRD, por eso solo se recuerda el mes y se remite a la fuente oficial.
 */
export const DRILL_EVERY_DAYS = 90;
/** Mes del Simulacro Nacional (0 = enero). Se avisa desde el mes anterior. */
export const NATIONAL_DRILL_MONTH = 9;

const DAY = 86_400_000;

export interface DrillReminder {
  /** Días desde el último simulacro, o null si nunca se ha hecho. */
  daysSinceLast: number | null;
  personalDue: boolean;
  /** true en septiembre y octubre. */
  nationalSoon: boolean;
}

export function drillReminder(alerts: AlertRecord[], today: Date = new Date()): DrillReminder {
  const last = alerts
    .filter((a) => a.isDrill && !a.isSeed)
    .map((a) => new Date(a.activatedAt).getTime())
    .sort((a, b) => b - a)[0];
  const daysSinceLast = last === undefined ? null : Math.floor((today.getTime() - last) / DAY);
  const month = today.getMonth();
  return {
    daysSinceLast,
    personalDue: daysSinceLast === null || daysSinceLast >= DRILL_EVERY_DAYS,
    nationalSoon: month === NATIONAL_DRILL_MONTH - 1 || month === NATIONAL_DRILL_MONTH,
  };
}
