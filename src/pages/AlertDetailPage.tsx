// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { SearchX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { ActiveAlertBadge, DemoBadge, StatusBadge } from '../components/StatusBadge';
import { deliveryBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { eventTypeLabel, formatDateTime, formatDuration } from '../utils/format';

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useIonRouter();
  const { data } = useAppState();
  const alert = data.alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <AppLayout title="Detalle" backTo="/historial">
        <section className="card empty-state">
          <SearchX size={44} aria-hidden="true" />
          <h2>Registro no encontrado</h2>
          <p className="muted">Es posible que los datos de demostración se hayan restablecido.</p>
        </section>
      </AppLayout>
    );
  }

  const delivery = deliveryBadge[alert.digitalStatus];
  return (
    <AppLayout title="Detalle de alerta" backTo="/historial">
      <section className="card">
        <div className="card__head">
          <h1 className="h2">{eventTypeLabel[alert.eventType]}</h1>
          {alert.status === 'activa' ? <ActiveAlertBadge /> : <StatusBadge tone="neutral" label="Finalizada" />}
        </div>
        {alert.isSeed && <DemoBadge label="Registro de ejemplo (ficticio)" />}
        <dl className="kv kv--rows">
          <div><dt>Activada</dt><dd>{formatDateTime(alert.activatedAt)}</dd></div>
          <div><dt>Finalizada</dt><dd>{alert.endedAt ? formatDateTime(alert.endedAt) : 'En curso'}</dd></div>
          <div><dt>Duración</dt><dd>{formatDuration(alert.activatedAt, alert.endedAt)}</dd></div>
          <div><dt>Contactos configurados</dt><dd>{alert.contactsCount}</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2 className="card__title">Canales</h2>
        <div className="channel">
          <div><strong>Alerta local</strong><p className="small muted">Activada en el dispositivo.</p></div>
          <StatusBadge tone="info" label="Local" />
        </div>
        <div className="channel">
          <div>
            <strong>Canal digital</strong>
            <p className="small muted">{alert.simulatedDelivery ? 'Estado simulado: no se envió ningún mensaje.' : 'Sin envío: canal no implementado.'}</p>
          </div>
          <span className="badge-col">
            <StatusBadge tone={delivery.tone} label={delivery.label} />
            {alert.simulatedDelivery && <DemoBadge label="Simulación" />}
          </span>
        </div>
        {alert.note && <p className="small muted">{alert.note}</p>}
      </section>

      <LocationStatusCard snapshot={alert.location} permission={data.locationPermission} compact />

      {alert.status === 'activa' && (
        <button className="btn btn--danger btn--block" onClick={() => router.push('/alerta', 'forward')}>Ver alerta activa</button>
      )}
    </AppLayout>
  );
}
