// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useState, type ReactNode } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { distanceKm } from '../services/quakeService';
import { formatDistance } from '../services/routeService';
import type { MeetingPoint } from '../types';
import { nearestMeetingPoint } from '../utils/meetingPoints';

type Position = { latitude: number; longitude: number } | null | undefined;

/**
 * Punto de encuentro hacia el que guían la brújula y la ruta: por defecto el más cercano a `from`.
 * Con dos o más puntos devuelve también `chooser`, unos botones para elegir otro.
 */
export function useMeetingTarget(from: Position): { point: MeetingPoint | null; chooser: ReactNode } {
  const { data } = useAppState();
  const t = useT().features.compass;
  const [chosenId, setChosenId] = useState<string | null>(null);
  const points = data.meetingPoints;
  const nearest = nearestMeetingPoint(points, from);
  const point = points.find((p) => p.id === chosenId) ?? nearest;

  const chooser =
    points.length > 1 ? (
      <div className="meeting-chooser" role="group" aria-label={t.chooseLabel}>
        <small className="muted">{t.chooseLabel}</small>
        {points.map((p) => (
          <button
            key={p.id}
            className={`chip${p.id === point?.id ? ' chip--active' : ''}`}
            aria-pressed={p.id === point?.id}
            onClick={() => setChosenId(p.id)}
          >
            {p.label}
            {from && <small> · {formatDistance(distanceKm(from.latitude, from.longitude, p.latitude, p.longitude) * 1000)}</small>}
            {p.id === nearest?.id && <small> · {t.nearest}</small>}
          </button>
        ))}
      </div>
    ) : null;

  return { point, chooser };
}
