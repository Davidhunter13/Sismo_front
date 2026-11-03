// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { useEffect, useRef } from 'react';
import { useT } from '../i18n/useT';
import { CompassRose } from './CompassRose';
import { useCompassNeedle } from './useCompassNeedle';

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

/**
 * Brújula pequeña para el panel principal. Gira en vivo con el magnetómetro del teléfono:
 * - con punto de encuentro (y una ubicación guardada) apunta hacia él y muestra la distancia;
 * - sin punto de encuentro apunta al norte e invita a configurarlo.
 * Sin sensor (computador) la aguja se balancea suavemente («buscando»). Al tocarla abre la brújula completa.
 * `onVisibleChange` avisa si está en pantalla (al salir con el scroll, el encabezado muestra una brújula).
 */
export function MiniCompass({ onVisibleChange }: { onVisibleChange?: (visible: boolean) => void }) {
  const router = useIonRouter();
  const all = useT();
  const t = all.features.compass;
  const { heading, target, point, meters } = useCompassNeedle();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onVisibleChange || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => onVisibleChange(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibleChange(true);
    };
  }, [onVisibleChange]);

  // Si el punto conserva el nombre por defecto («Punto de encuentro») no se repite en el título.
  const title = point
    ? point.label === all.location.meeting.defaultLabel ? point.label : t.miniTo(point.label)
    : t.miniNorth;
  const detail = point
    ? meters !== null ? t.distance(formatDistance(meters)) : t.miniNeedLocation
    : t.miniSetUp;

  return (
    <button ref={ref} className={`card mini-compass${point ? '' : ' meeting-missing'}`} onClick={() => router.push('/ubicacion?ver=brujula', 'forward')} aria-label={`${title}. ${detail}`}>
      {/* Rosa con N, E, S y O que gira con el teléfono; la aguja marca el punto de encuentro (o el norte). */}
      <CompassRose size={64} heading={heading} target={target} compact className="mini-compass__rose" />
      <span className="mini-compass__text">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </button>
  );
}

/** Versión del encabezado: rosa pequeña con N, E, S y O girando, junto al botón de tema. */
export function HeaderCompass() {
  const router = useIonRouter();
  const t = useT().features.compass;
  const { heading, target } = useCompassNeedle();
  return (
    <button className="icon-btn header-compass" onClick={() => router.push('/ubicacion?ver=brujula', 'forward')} aria-label={t.headerLabel}>
      <CompassRose size={40} heading={heading} target={target} compact className="header-compass__rose" />
    </button>
  );
}
