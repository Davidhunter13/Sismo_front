// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { Activity, ExternalLink, Info, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { getLocale } from '../i18n';
import { useT } from '../i18n/useT';
import { fetchNearbyQuakes, NEARBY_RADIUS_KM, type Quake, type QuakePeriod } from '../services/quakeService';

type Status = 'cargando' | 'listo' | 'error';

const magnitudeTone = (m: number) => (m >= 6 ? 'quake-mag--high' : m >= 4.5 ? 'quake-mag--mid' : 'quake-mag--low');

export default function QuakesPage() {
  const { data } = useAppState();
  const t = useT().quakes;
  const locale = getLocale(data.settings.language);
  const [period, setPeriod] = useState<QuakePeriod>('day');
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [status, setStatus] = useState<Status>('cargando');

  // Solo se usa una ubicación real del dispositivo; las coordenadas de prueba se ignoran.
  const origin = data.lastLocation?.source === 'dispositivo' ? data.lastLocation : null;
  const originKey = origin ? `${origin.latitude},${origin.longitude}` : '';

  const load = useCallback(async () => {
    setStatus('cargando');
    try {
      setQuakes(await fetchNearbyQuakes(period, origin));
      setStatus('listo');
    } catch {
      setStatus('error');
    }
    // originKey resume la ubicación para no recargar con cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, originKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <IonSegment value={period} onIonChange={(e) => setPeriod(e.detail.value as QuakePeriod)} className="segment">
        <IonSegmentButton value="day"><IonLabel>{t.day}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="week"><IonLabel>{t.week}</IonLabel></IonSegmentButton>
      </IonSegment>

      <p className="small muted">
        {origin ? t.nearby(NEARBY_RADIUS_KM) : t.colombia}
      </p>

      <section className="card card--flush">
        {status === 'cargando' && (
          <div className="real-map__placeholder"><Loader2 size={22} className="spin" aria-hidden="true" /> {t.loading}</div>
        )}
        {status === 'error' && (
          <div className="real-map__placeholder"><WifiOff size={22} aria-hidden="true" /> {t.error}</div>
        )}
        {status === 'listo' && quakes.length === 0 && (
          <div className="real-map__placeholder"><Activity size={22} aria-hidden="true" /> {t.empty}</div>
        )}
        {status === 'listo' && quakes.length > 0 && (
          <ul className="quake-list">
            {quakes.map((q) => (
              <li key={q.id} className="quake-row">
                <span className={`quake-mag ${magnitudeTone(q.magnitude)}`}>{q.magnitude.toFixed(1)}</span>
                <div>
                  <strong>{q.place}</strong>
                  <small>
                    {new Date(q.time).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                    {t.depth(Math.round(q.depthKm))}
                    {q.distanceKm != null && t.distance(Math.round(q.distanceKm))}
                  </small>
                </div>
                {q.url && (
                  <a className="icon-btn icon-btn--soft" href={q.url} target="_blank" rel="noopener noreferrer" aria-label={t.detail}>
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="btn btn--outline btn--block" onClick={() => void load()} disabled={status === 'cargando'}>
        <RefreshCw size={18} aria-hidden="true" /> {t.refresh}
      </button>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> {t.sourceTitle}</h2>
        <ul className="bullets">
          {t.source.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>
    </AppLayout>
  );
}
