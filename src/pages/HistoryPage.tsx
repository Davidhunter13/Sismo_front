// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { History } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { HistoryItem } from '../components/HistoryItem';
import { useAppState } from '../context/appContext';

export default function HistoryPage() {
  const router = useIonRouter();
  const { data } = useAppState();
  const alerts = [...data.alerts].sort((a, b) => b.activatedAt.localeCompare(a.activatedAt));
  const active = alerts.filter((a) => a.status === 'activa').length;

  return (
    <AppLayout title="Historial de alertas" backTo="/inicio">
      <div className="stats">
        <div className="card stat"><strong>{alerts.length}</strong><small>Total</small></div>
        <div className="card stat"><strong>{active}</strong><small>Activas</small></div>
        <div className="card stat"><strong>{alerts.filter((a) => a.isSeed).length}</strong><small>De ejemplo</small></div>
      </div>

      {alerts.length === 0 ? (
        <section className="card empty-state">
          <History size={44} aria-hidden="true" />
          <h2>Sin registros</h2>
          <p className="muted">Las alertas que active aparecerán aquí. También puede activar el modo de demostración en Configuración.</p>
        </section>
      ) : (
        <ul className="list">
          {alerts.map((a) => (
            <HistoryItem key={a.id} alert={a} onOpen={() => router.push(`/historial/${a.id}`, 'forward')} />
          ))}
        </ul>
      )}
      <p className="small muted center">«(sim.)» indica un estado del canal digital simulado: no se envió ningún mensaje real.</p>
    </AppLayout>
  );
}
