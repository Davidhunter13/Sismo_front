// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonCheckbox, useIonRouter } from '@ionic/react';
import { ClipboardCheck, MapPinned, Navigation, RotateCcw, Route } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { MeetingCompass } from '../components/MeetingCompass';
import { MeetingRoute } from '../components/MeetingRoute';
import { useMeetingTarget } from '../components/useMeetingTarget';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { formatDateTime } from '../utils/format';

/**
 * Lista de verificación «Después del sismo». Cada alerta tiene su propia lista: al dar SOS se crea una
 * alerta nueva y la lista empieza vacía; las anteriores quedan guardadas con su alerta.
 * - Con ?alerta=<id> se muestra la de esa alerta.
 * - Sin parámetro, la de la alerta real más reciente; si nunca hubo una, la lista de práctica.
 */
export default function PostQuakePage() {
  const tf = useT().features;
  const t = tf.postQuake;
  const tr = tf.route;
  const router = useIonRouter();
  const { search } = useLocation();
  const { data, setPostQuakeDone } = useAppState();

  const requestedId = new URLSearchParams(search).get('alerta');
  const realAlerts = data.alerts.filter((a) => !a.isSeed && !a.isDrill);
  const alert = (requestedId ? data.alerts.find((a) => a.id === requestedId) : undefined) ?? realAlerts[0] ?? null;
  const done = new Set(alert ? alert.postQuakeDone ?? [] : data.postQuakeDone);
  // Brújula y ruta hacia el punto de encuentro más cercano (se puede elegir otro).
  const from = alert?.location ?? data.lastLocation;
  const meeting = useMeetingTarget(from);

  const save = (next: number[]) => setPostQuakeDone(next, alert?.id);

  const toggle = (i: number, checked: boolean) => {
    const next = new Set(done);
    if (checked) next.add(i);
    else next.delete(i);
    save([...next].sort((a, b) => a - b));
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <section className="card stack">
        <h2 className="card__title"><ClipboardCheck size={18} aria-hidden="true" /> {t.progress(done.size, t.steps.length)}</h2>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={t.steps.length} aria-valuenow={done.size}>
          <span style={{ width: `${(done.size / t.steps.length) * 100}%` }} />
        </div>
        <p className="small muted">{alert ? t.forAlert(formatDateTime(alert.activatedAt)) : t.practice}</p>
        <p className="small muted">{t.subtitle}</p>
      </section>

      {/* Punto de encuentro: tras «Estoy a salvo» la persona ve a dónde ir y la brújula para llegar. */}
      <section className={`card stack${meeting.point ? '' : ' meeting-missing'}`}>
        <h2 className="card__title"><Navigation size={18} aria-hidden="true" /> {t.meetingTitle}</h2>
        {meeting.point ? (
          <>
            <p className="small">{t.meetingHint(meeting.point.label)}</p>
            {meeting.chooser}
            <MeetingCompass meetingPoint={meeting.point} fallback={from} />
            <h3 className="card__title"><Route size={16} aria-hidden="true" /> {tr.title}</h3>
            <MeetingRoute meetingPoint={meeting.point} from={from} />
          </>
        ) : (
          <>
            <p className="small">{t.noMeeting}</p>
            <button className="btn btn--outline btn--block" onClick={() => router.push('/ubicacion?ver=brujula', 'forward')}>
              <MapPinned size={18} aria-hidden="true" /> {t.configureMeeting}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <ol className="kit-list">
          {t.steps.map((step, i) => (
            <li key={step} className="kit-item">
              <IonCheckbox checked={done.has(i)} onIonChange={(e) => toggle(i, e.detail.checked)} aria-label={step} />
              <span className={done.has(i) ? 'kit-item__name kit-item__name--done' : 'kit-item__name'}>
                <strong>{i + 1}.</strong> {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <button className="btn btn--ghost btn--block" onClick={() => save([])} disabled={done.size === 0}>
        <RotateCcw size={16} aria-hidden="true" /> {t.reset}
      </button>
      <p className="small muted center">{t.disclaimer}</p>
    </AppLayout>
  );
}
