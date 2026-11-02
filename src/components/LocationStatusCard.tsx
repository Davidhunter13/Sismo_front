// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Crosshair, MapPinOff } from 'lucide-react';
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
  const perm = permissionBadge[permission];
  const isTest = snapshot?.source === 'prueba';

  return (
    <section className="card location-card">
      <div className="card__head">
        <h2>{compact ? 'Ubicación' : 'Estado de la ubicación'}</h2>
        <StatusBadge tone={perm.tone} label={perm.label} />
      </div>
      {snapshot ? (
        <>
          {isTest ? (
            <div className="callout callout--demo">
              <DemoBadge label="Coordenadas de prueba" />
              <p>No corresponden a su posición actual. Se usan solo para demostrar la interfaz.</p>
            </div>
          ) : (
            <StatusBadge tone="success" label="Ubicación del dispositivo" icon={Crosshair} />
          )}
          <dl className="kv">
            <div><dt>Latitud</dt><dd>{formatCoord(snapshot.latitude)}</dd></div>
            <div><dt>Longitud</dt><dd>{formatCoord(snapshot.longitude)}</dd></div>
            <div><dt>Precisión</dt><dd>{snapshot.accuracy != null ? `± ${Math.round(snapshot.accuracy)} m` : 'No aplica'}</dd></div>
            <div><dt>Registrada</dt><dd>{formatDateTime(snapshot.timestamp)}</dd></div>
          </dl>
        </>
      ) : (
        <div className="empty-inline">
          <MapPinOff size={22} aria-hidden="true" />
          <p>No hay ubicación registrada. {compact ? 'Puede solicitarla en la sección Ubicación.' : 'Solicítela con el botón inferior.'}</p>
        </div>
      )}
    </section>
  );
}
