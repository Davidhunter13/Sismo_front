// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useState } from 'react';
import { useAppState } from '../context/appContext';
import { bearingDeg, normalize, watchHeading } from '../services/compassService';
import { distanceKm } from '../services/quakeService';
import { nearestMeetingPoint } from '../utils/meetingPoints';

/**
 * Giro de la aguja de las brújulas pequeñas (Inicio y encabezado), en vivo con el magnetómetro.
 * Con puntos de encuentro y una ubicación guardada apunta al más cercano; si no, al norte.
 * No enciende el GPS: usa la última ubicación guardada (ahorro de batería).
 */
export function useCompassNeedle() {
  const { data } = useAppState();
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => watchHeading(setHeading), []);

  const here = data.lastLocation;
  const point = nearestMeetingPoint(data.meetingPoints, here);
  const target = point && here ? bearingDeg(here.latitude, here.longitude, point.latitude, point.longitude) : 0;
  return {
    /** Grados a rotar la aguja (relativos al teléfono si hay sensor; si no, respecto al norte). */
    rotation: heading === null ? target : normalize(target - heading),
    /** true si no hay magnetómetro (computador): la aguja se balancea suavemente. */
    idle: heading === null,
    /** Orientación del teléfono (null sin sensor) y rumbo al punto de encuentro (null si no hay). */
    heading,
    target: point && here ? target : null,
    point,
    meters: point && here ? distanceKm(here.latitude, here.longitude, point.latitude, point.longitude) * 1000 : null,
  };
}
