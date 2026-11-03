// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useT } from '../i18n/useT';
import type { LocationSnapshot } from '../types';
import { formatCoord } from '../utils/format';

/**
 * Representación ESQUEMÁTICA (no es un mapa real): cuadrícula con un marcador.
 * No hay servicio de mapas configurado en el prototipo.
 */
export function LocationMap({ snapshot }: { snapshot: LocationSnapshot | null }) {
  const t = useT().components.map;
  const isTest = snapshot?.source === 'prueba';
  return (
    <figure className="schematic-map" aria-label={t.schematicLabel}>
      <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity=".12" />
          </pattern>
        </defs>
        <rect width="320" height="170" fill="url(#grid)" />
        <path d="M0 120 C80 100 140 140 320 90" stroke="currentColor" strokeOpacity=".18" strokeWidth="10" fill="none" />
        <path d="M110 0 L150 170" stroke="currentColor" strokeOpacity=".18" strokeWidth="8" fill="none" />
        {snapshot ? (
          <g transform="translate(160 78)">
            {snapshot.accuracy != null && <circle r="34" className="schematic-map__accuracy" />}
            <circle r="9" className={isTest ? 'schematic-map__pin--test' : 'schematic-map__pin'} />
            <circle r="3.5" fill="#fff" />
          </g>
        ) : (
          <text x="160" y="90" textAnchor="middle" className="schematic-map__empty">{t.noLocation}</text>
        )}
      </svg>
      <figcaption>
        {snapshot
          ? `${isTest ? t.testPrefix : ''}${formatCoord(snapshot.latitude)}, ${formatCoord(snapshot.longitude)}`
          : t.noData}
        <span>{t.notReal}</span>
      </figcaption>
    </figure>
  );
}
