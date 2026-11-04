// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { distanceKm } from '../services/quakeService';
import type { MeetingPoint } from '../types';

import { getCatalogs } from '../services/catalogService';

/** Tope de puntos de encuentro (parámetro administrable): todos van en el SMS, que debe seguir siendo corto. */
export const maxMeetingPoints = (): number => getCatalogs().params.maxMeetingPoints;

/**
 * Punto de encuentro más cercano a una posición: es el que usan la brújula y la ruta por defecto.
 * Sin posición conocida, el primero de la lista.
 */
export function nearestMeetingPoint(
  points: MeetingPoint[],
  from: { latitude: number; longitude: number } | null | undefined,
): MeetingPoint | null {
  if (points.length === 0) return null;
  if (!from) return points[0];
  const dist = (p: MeetingPoint) => distanceKm(from.latitude, from.longitude, p.latitude, p.longitude);
  return points.reduce((best, p) => (dist(p) < dist(best) ? p : best));
}
