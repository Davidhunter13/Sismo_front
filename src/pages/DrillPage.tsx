// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { BarChart3, ClipboardCheck, Play, Timer } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { drillReminder } from '../services/drillReminderService';
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
  const { features, drill: t } = useT();
  const rt = features.drillReminder;
  const reminder = drillReminder(data.alerts);

  const start = () => {
    startDrill();
    goToRoot(router, '/inicio');
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <section className="card stack">
        <h2 className="card__title"><Timer size={18} aria-hidden="true" /> {t.howTitle}</h2>
        <ol className="bullets">
          <li>{t.step1}</li>
          <li>{t.step2Before}<strong>{t.step2Signal}</strong>{t.step2After}</li>
          <li>{t.step3}</li>
          <li>{t.step4}</li>
          <li>{t.step5}</li>
        </ol>
        <p className="small muted">{t.saved}</p>
        <button className="btn btn--primary btn--lg btn--block" onClick={start} disabled={!!activeAlert}>
          <Play size={20} aria-hidden="true" /> {t.start}
        </button>
        {activeAlert && <p className="small muted">{t.busy}</p>}
      </section>

      <section className="card stack">
        <p className="small">
          {reminder.daysSinceLast === null
            ? rt.personalNever
            : reminder.personalDue ? rt.personalDue(reminder.daysSinceLast) : rt.lastDrill(reminder.daysSinceLast)}
        </p>
        {reminder.nationalSoon && <p className="callout callout--info small">{rt.national}</p>}
      </section>

      <section className="card">
        <h2 className="card__title">{t.lastTitle}</h2>
        {drills.length === 0 ? (
          <p className="muted small">{t.none}</p>
        ) : (
          <ul className="service-list">
            {drills.map((a) => {
              const r = metricValue(a, 'drillReaction');
              return (
                <li key={a.id} className="service-row">
                  <span>{formatTime(a.activatedAt)}</span>
                  <strong>{r != null ? t.reaction(formatMs(r)) : t.early}</strong>
                </li>
              );
            })}
          </ul>
        )}
        <div className="btn-pair">
          <button className="btn btn--ghost" onClick={() => router.push('/estadisticas', 'forward')}>
            <BarChart3 size={18} aria-hidden="true" /> {t.stats}
          </button>
          <button className="btn btn--ghost" onClick={() => router.push('/encuesta', 'forward')}>
            <ClipboardCheck size={18} aria-hidden="true" /> {t.survey}
          </button>
        </div>
      </section>
    </AppLayout>
  );
}
