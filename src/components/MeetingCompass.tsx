// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Geolocation } from '@capacitor/geolocation';
import { Compass } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../i18n/useT';
import { bearingDeg, cardinal, watchHeading } from '../services/compassService';
import { distanceKm } from '../services/quakeService';
import type { MeetingPoint } from '../types';
import { CompassRose } from './CompassRose';

/** A menos de esta distancia (m) se considera que ya llegó. */
const ARRIVED_M = 25;

interface Props {
  meetingPoint: MeetingPoint | null;
  /** Posición conocida mientras llega la primera lectura del GPS. */
  fallback?: { latitude: number; longitude: number } | null;
}

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

/** Brújula hacia el punto de encuentro: sin internet, con GPS en vivo y el magnetómetro del teléfono. */
export function MeetingCompass({ meetingPoint, fallback = null }: Props) {
  const t = useT().features.compass;
  const [position, setPosition] = useState(fallback);
  const [heading, setHeading] = useState<number | null>(null);

  // Posición en vivo mientras la brújula está en pantalla.
  useEffect(() => {
    if (!meetingPoint) return;
    let id: string | null = null;
    let cancelled = false;
    Geolocation.watchPosition({ enableHighAccuracy: true, maximumAge: 5000 }, (pos) => {
      if (pos) setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })
      .then((watchId) => {
        if (cancelled) void Geolocation.clearWatch({ id: watchId });
        else id = watchId;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (id) void Geolocation.clearWatch({ id });
    };
  }, [meetingPoint]);

  useEffect(() => (meetingPoint ? watchHeading(setHeading) : undefined), [meetingPoint]);

  if (!meetingPoint) {
    return <p className="small muted">{t.noMeeting}</p>;
  }
  if (!position) {
    return <p className="small muted">{t.noLocation}</p>;
  }

  const bearing = bearingDeg(position.latitude, position.longitude, meetingPoint.latitude, meetingPoint.longitude);
  const meters = distanceKm(position.latitude, position.longitude, meetingPoint.latitude, meetingPoint.longitude) * 1000;
  const arrived = meters <= ARRIVED_M;

  return (
    <div className="compass">
      {/* La rosa gira con el teléfono (N = norte real) y la flecha marca el rumbo al punto de encuentro. */}
      <div role="img" aria-label={t.arrowLabel}>
        <CompassRose
          size={210}
          heading={heading}
          target={bearing}
          center={arrived ? <Compass size={64} className="compass__arrived" /> : undefined}
        />
      </div>
      <strong className="compass__distance">{arrived ? t.arrived : t.distance(formatDistance(meters))}</strong>
      <span className="small muted">{t.direction(Math.round(bearing), cardinal(bearing, t.cardinals))} · {meetingPoint.label}</span>
      <p className="small muted">{heading === null ? t.noSensor : t.calibrate}</p>
      <p className="small muted">{t.offline}</p>
    </div>
  );
}
