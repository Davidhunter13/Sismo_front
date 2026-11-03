// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getT } from '../i18n';
import type { SusResponse } from '../types';

/**
 * System Usability Scale (SUS, Brooke 1996): 10 afirmaciones con escala 1–5.
 * Ítems impares en positivo y pares en negativo. Puntaje 0–100; 68 es el promedio de referencia.
 */

/**
 * Lista de solo lectura que refleja el idioma activo: se lee al acceder, no al importar el módulo.
 * Reenvía también `has`/`ownKeys`/descriptores porque map, filter, etc. consultan si existe cada índice.
 */
const localizedList = (pick: () => readonly string[]): readonly string[] =>
  new Proxy([] as string[], {
    get: (_, key) => Reflect.get(pick(), key),
    has: (_, key) => Reflect.has(pick(), key),
    ownKeys: () => Reflect.ownKeys(pick()),
    getOwnPropertyDescriptor: (_, key) => Reflect.getOwnPropertyDescriptor(pick(), key),
  });

/** Afirmaciones del SUS en el idioma activo. */
export const SUS_ITEMS = localizedList(() => getT().services.sus.items);

/** Escala de respuesta 1–5 en el idioma activo. */
export const SUS_SCALE = localizedList(() => getT().services.sus.scale);

/** Puntaje SUS. Lanza error si no hay exactamente 10 respuestas entre 1 y 5. */
export function susScore(answers: number[]): number {
  if (answers.length !== 10 || answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)) {
    throw new Error(getT().services.sus.invalidAnswers);
  }
  const sum = answers.reduce((acc, a, i) => acc + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return sum * 2.5;
}

/** Interpretación orientativa por rangos (Bangor, Kortum y Miller, 2009). */
export function susGrade(score: number): string {
  const g = getT().services.sus.grade;
  if (score >= 85) return g.excellent;
  if (score >= 72) return g.good;
  if (score >= 68) return g.acceptable;
  if (score >= 51) return g.fair;
  return g.poor;
}

/** CSV de respuestas SUS (sin datos personales). */
export function susToCsv(responses: SusResponse[]): string {
  const header = ['id', 'fecha', ...SUS_ITEMS.map((_, i) => `p${i + 1}`), 'puntaje', 'tras_simulacro'];
  const rows = responses.map((r) => [r.id, r.answeredAt, ...r.answers, r.score, r.drillAlertId ? 'si' : 'no']);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}
