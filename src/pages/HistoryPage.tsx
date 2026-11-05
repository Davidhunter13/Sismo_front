// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useRecordOnEnter } from '../components/useBadges';
import { useIonRouter } from '@ionic/react';
import { History } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { HistoryItem } from '../components/HistoryItem';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';

export default function HistoryPage() {
  useRecordOnEnter('ver_historial');
  const router = useIonRouter();
  const { data } = useAppState();
  const t = useT().history;
  const alerts = [...data.alerts].sort((a, b) => b.activatedAt.localeCompare(a.activatedAt));
  const active = alerts.filter((a) => a.status === 'activa').length;

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <div className="stats">
        <div className="card stat"><strong>{alerts.length}</strong><small>{t.total}</small></div>
        <div className="card stat"><strong>{active}</strong><small>{t.active}</small></div>
        <div className="card stat"><strong>{alerts.filter((a) => a.isSeed).length}</strong><small>{t.samples}</small></div>
      </div>

      {alerts.length === 0 ? (
        <section className="card empty-state">
          <History size={44} aria-hidden="true" />
          <h2>{t.emptyTitle}</h2>
          <p className="muted">{t.emptyText}</p>
        </section>
      ) : (
        <ul className="list">
          {alerts.map((a) => (
            <HistoryItem key={a.id} alert={a} onOpen={() => router.push(`/historial/${a.id}`, 'forward')} />
          ))}
        </ul>
      )}
      <p className="small muted center">{t.simNote}</p>
    </AppLayout>
  );
}
