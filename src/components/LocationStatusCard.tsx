// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Crosshair, MapPinOff } from 'lucide-react';
import { useT } from '../i18n/useT';
import type { LocationPermission, LocationSnapshot } from '../types';
import { formatCoord, formatDateTime } from '../utils/format';
import { DemoBadge, StatusBadge } from './StatusBadge';
import { permissionBadge } from './statusMaps';

interface LocationStatusCardProps {
  snapshot: LocationSnapshot | null;
  permission: LocationPermission;
  compact?: boolean;
}

export function LocationStatusCard({ snapshot, permission, compact = false }: LocationStatusCardProps) {
  const t = useT().components.locationCard;
  const perm = permissionBadge[permission];
  const isTest = snapshot?.source === 'prueba';

  return (
    <section className="card location-card">
      <div className="card__head">
        <h2>{compact ? t.titleCompact : t.title}</h2>
        <StatusBadge tone={perm.tone} label={perm.label} />
      </div>
      {snapshot ? (
        <>
          {isTest ? (
            <div className="callout callout--demo">
              <DemoBadge label={t.testCoords} />
              <p>{t.testText}</p>
            </div>
          ) : (
            <StatusBadge tone="success" label={t.device} icon={Crosshair} />
          )}
          <dl className="kv">
            <div><dt>{t.latitude}</dt><dd>{formatCoord(snapshot.latitude)}</dd></div>
            <div><dt>{t.longitude}</dt><dd>{formatCoord(snapshot.longitude)}</dd></div>
            <div><dt>{t.accuracy}</dt><dd>{snapshot.accuracy != null ? `± ${Math.round(snapshot.accuracy)} m` : t.notApplicable}</dd></div>
            <div><dt>{t.recorded}</dt><dd>{formatDateTime(snapshot.timestamp)}</dd></div>
          </dl>
        </>
      ) : (
        <div className="empty-inline">
          <MapPinOff size={22} aria-hidden="true" />
          <p>{t.none} {compact ? t.noneCompact : t.noneFull}</p>
        </div>
      )}
    </section>
  );
}
