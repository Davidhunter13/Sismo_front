// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { BarChart3, ClipboardCheck, Play, Timer } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { formatMs, metricValue } from '../services/metricsService';
import { formatTime } from '../utils/format';
import { goToRoot } from '../utils/navigation';

/**
 * Simulacro guiado: tras una espera aleatoria aparece la señal «¡SISMO!» en el panel principal y se mide
 * cuánto tarda la persona en tocar SOS y confirmar. Las alertas quedan marcadas como simulacro.
 */
export default function DrillPage() {
  const router = useIonRouter();
  const { data, activeAlert, startDrill } = useAppState();
  const drills = data.alerts.filter((a) => a.isDrill && !a.isSeed).slice(0, 5);

  const start = () => {
    startDrill();
    goToRoot(router, '/inicio');
  };

  return (
    <AppLayout title="Simulacro" backTo="/inicio">
      <section className="card stack">
        <h2 className="card__title"><Timer size={18} aria-hidden="true" /> ¿Cómo funciona?</h2>
        <ol className="bullets">
          <li>Toque «Comenzar»: volverá al panel principal.</li>
          <li>Tras unos segundos aparecerá el aviso <strong>«¡SISMO! Active la alerta ahora»</strong>.</li>
          <li>Toque SOS y confirme lo más rápido posible.</li>
          <li>La sirena, la linterna y la vibración se activan como en una emergencia real. Finalice la alerta al terminar.</li>
          <li>Al finalizar se abre la encuesta de usabilidad (SUS): son 10 preguntas rápidas.</li>
        </ol>
        <p className="small muted">El resultado se guarda en el historial como simulacro y alimenta las estadísticas.</p>
        <button className="btn btn--primary btn--lg btn--block" onClick={start} disabled={!!activeAlert}>
          <Play size={20} aria-hidden="true" /> Comenzar simulacro
        </button>
        {activeAlert && <p className="small muted">Finalice la alerta activa antes de iniciar un simulacro.</p>}
      </section>

      <section className="card">
        <h2 className="card__title">Últimos simulacros</h2>
        {drills.length === 0 ? (
          <p className="muted small">Aún no ha hecho simulacros.</p>
        ) : (
          <ul className="service-list">
            {drills.map((a) => {
              const r = metricValue(a, 'drillReaction');
              return (
                <li key={a.id} className="service-row">
                  <span>{formatTime(a.activatedAt)}</span>
                  <strong>{r != null ? `Reacción: ${formatMs(r)}` : 'Activó antes de la señal'}</strong>
                </li>
              );
            })}
          </ul>
        )}
        <div className="btn-pair">
          <button className="btn btn--ghost" onClick={() => router.push('/estadisticas', 'forward')}>
            <BarChart3 size={18} aria-hidden="true" /> Estadísticas
          </button>
          <button className="btn btn--ghost" onClick={() => router.push('/encuesta', 'forward')}>
            <ClipboardCheck size={18} aria-hidden="true" /> Encuesta SUS
          </button>
        </div>
      </section>
    </AppLayout>
  );
}
