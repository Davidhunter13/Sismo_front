// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { SusResponse } from '../types';

/**
 * System Usability Scale (SUS, Brooke 1996): 10 afirmaciones con escala 1–5.
 * Ítems impares en positivo y pares en negativo. Puntaje 0–100; 68 es el promedio de referencia.
 */
export const SUS_ITEMS = [
  'Creo que me gustaría usar esta aplicación con frecuencia.',
  'Encontré la aplicación innecesariamente compleja.',
  'Pensé que la aplicación era fácil de usar.',
  'Creo que necesitaría el apoyo de una persona experta para poder usar esta aplicación.',
  'Encontré que las funciones de la aplicación estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en la aplicación.',
  'Imagino que la mayoría de las personas aprendería a usar esta aplicación muy rápidamente.',
  'Encontré la aplicación muy difícil de usar.',
  'Me sentí muy seguro/a usando la aplicación.',
  'Necesité aprender muchas cosas antes de poder empezar a usar esta aplicación.',
];

export const SUS_SCALE = ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'];

/** Puntaje SUS. Lanza error si no hay exactamente 10 respuestas entre 1 y 5. */
export function susScore(answers: number[]): number {
  if (answers.length !== 10 || answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)) {
    throw new Error('Se requieren 10 respuestas entre 1 y 5.');
  }
  const sum = answers.reduce((acc, a, i) => acc + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return sum * 2.5;
}

/** Interpretación orientativa por rangos (Bangor, Kortum y Miller, 2009). */
export function susGrade(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 72) return 'Buena';
  if (score >= 68) return 'Aceptable (sobre el promedio)';
  if (score >= 51) return 'Regular (bajo el promedio)';
  return 'Deficiente';
}

/** CSV de respuestas SUS (sin datos personales). */
export function susToCsv(responses: SusResponse[]): string {
  const header = ['id', 'fecha', ...SUS_ITEMS.map((_, i) => `p${i + 1}`), 'puntaje', 'tras_simulacro'];
  const rows = responses.map((r) => [r.id, r.answeredAt, ...r.answers, r.score, r.drillAlertId ? 'si' : 'no']);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}
