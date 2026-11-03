// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Navigation } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '../i18n/useT';

/** El ícono «Navigation» de lucide viene inclinado 45° (apunta al noreste): se compensa para que 0° = norte. */
export const ICON_TILT = 45;

interface Props {
  /** Diámetro en px. */
  size: number;
  /** Orientación del teléfono respecto al norte; null = sin brújula (la N queda arriba). */
  heading: number | null;
  /** Rumbo al destino (grados desde el norte); null = sin destino (la aguja apunta al norte). */
  target: number | null;
  /** true = solo N, E, S y O (versión pequeña). */
  compact?: boolean;
  /** Contenido en lugar de la aguja (p. ej. el ícono de «ya llegó»). */
  center?: ReactNode;
  className?: string;
}

/**
 * Rosa de los vientos con puntos cardinales (N, NE, E, SE, S, SO, O, NO).
 * La rosa gira con el teléfono (−orientación) para que la N señale el norte real, y la aguja se dibuja
 * sobre la rosa en el rumbo del destino: así apunta al destino en el mundo real.
 */
export function CompassRose({ size, heading, target, compact = false, center, className = '' }: Props) {
  const cardinals = useT().features.compass.cardinals;
  const radius = size / 2 - (compact ? 7 : 14);
  const labels = cardinals.map((label, i) => ({ label, angle: i * 45, main: i % 2 === 0 })).filter((c) => !compact || c.main);

  return (
    <div
      className={`compass-rose${compact ? ' compass-rose--compact' : ''}${heading === null ? ' compass-rose--idle' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="compass-rose__card" style={{ transform: `rotate(${heading === null ? 0 : -heading}deg)` }}>
        {labels.map(({ label, angle, main }) => (
          <span
            key={label}
            className={`compass-rose__label${main ? ' compass-rose__label--main' : ''}${angle === 0 ? ' compass-rose__label--north' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${Math.sin((angle * Math.PI) / 180) * radius}px, ${-Math.cos((angle * Math.PI) / 180) * radius}px)`,
            }}
          >
            {label}
          </span>
        ))}
        {center ? (
          <span className="compass-rose__center">{center}</span>
        ) : (
          <span className="compass-rose__needle" style={{ transform: `rotate(${(target ?? 0) - ICON_TILT}deg)` }}>
            <Navigation size={compact ? 22 : size * 0.36} />
          </span>
        )}
      </div>
    </div>
  );
}
