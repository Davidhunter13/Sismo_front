// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { SearchX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { ActiveAlertBadge, DemoBadge, StatusBadge } from '../components/StatusBadge';
import { deliveryBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { eventTypeLabel, formatDateTime, formatDuration } from '../utils/format';

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useIonRouter();
  const { data } = useAppState();
  const t = useT().alert.detail;
  const alert = data.alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <AppLayout title={t.shortTitle} backTo="/historial">
        <section className="card empty-state">
          <SearchX size={44} aria-hidden="true" />
          <h2>{t.notFound}</h2>
          <p className="muted">{t.notFoundText}</p>
        </section>
      </AppLayout>
    );
  }

  const delivery = deliveryBadge[alert.digitalStatus];
  return (
    <AppLayout title={t.title} backTo="/historial">
      <section className="card">
        <div className="card__head">
          <h1 className="h2">{eventTypeLabel[alert.eventType]}</h1>
          {alert.status === 'activa' ? <ActiveAlertBadge /> : <StatusBadge tone="neutral" label={t.finished} />}
        </div>
        {alert.isSeed && <DemoBadge label={t.seed} />}
        <dl className="kv kv--rows">
          <div><dt>{t.activated}</dt><dd>{formatDateTime(alert.activatedAt)}</dd></div>
          <div><dt>{t.ended}</dt><dd>{alert.endedAt ? formatDateTime(alert.endedAt) : t.ongoing}</dd></div>
          <div><dt>{t.duration}</dt><dd>{formatDuration(alert.activatedAt, alert.endedAt)}</dd></div>
          <div><dt>{t.contacts}</dt><dd>{alert.contactsCount}</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2 className="card__title">{t.channels}</h2>
        <div className="channel">
          <div><strong>{t.local}</strong><p className="small muted">{t.localDetail}</p></div>
          <StatusBadge tone="info" label={t.localBadge} />
        </div>
        <div className="channel">
          <div>
            <strong>{t.digital}</strong>
            <p className="small muted">{alert.simulatedDelivery ? t.simulated : t.notImplemented}</p>
          </div>
          <span className="badge-col">
            <StatusBadge tone={delivery.tone} label={delivery.label} />
            {alert.simulatedDelivery && <DemoBadge label={t.simulation} />}
          </span>
        </div>
        {alert.note && <p className="small muted">{alert.note}</p>}
      </section>

      <LocationStatusCard snapshot={alert.location} permission={data.locationPermission} compact />

      {alert.status === 'activa' && (
        <button className="btn btn--danger btn--block" onClick={() => router.push('/alerta', 'forward')}>{t.viewActive}</button>
      )}
    </AppLayout>
  );
}
