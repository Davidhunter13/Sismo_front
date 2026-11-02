// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { Activity, ExternalLink, Info, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { fetchNearbyQuakes, NEARBY_RADIUS_KM, type Quake, type QuakePeriod } from '../services/quakeService';

type Status = 'cargando' | 'listo' | 'error';

const magnitudeTone = (m: number) => (m >= 6 ? 'quake-mag--high' : m >= 4.5 ? 'quake-mag--mid' : 'quake-mag--low');

export default function QuakesPage() {
  const { data } = useAppState();
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
    <AppLayout title="Sismos recientes" backTo="/inicio">
      <IonSegment value={period} onIonChange={(e) => setPeriod(e.detail.value as QuakePeriod)} className="segment">
        <IonSegmentButton value="day"><IonLabel>Últimas 24 h</IonLabel></IonSegmentButton>
        <IonSegmentButton value="week"><IonLabel>Últimos 7 días</IonLabel></IonSegmentButton>
      </IonSegment>

      <p className="small muted">
        {origin
          ? `Sismos de magnitud 2,5 o mayor a menos de ${NEARBY_RADIUS_KM} km de su última ubicación.`
          : 'Sismos de magnitud 2,5 o mayor en Colombia. Registre su ubicación para ver los cercanos a usted.'}
      </p>

      <section className="card card--flush">
        {status === 'cargando' && (
          <div className="real-map__placeholder"><Loader2 size={22} className="spin" aria-hidden="true" /> Consultando el catálogo del USGS…</div>
        )}
        {status === 'error' && (
          <div className="real-map__placeholder"><WifiOff size={22} aria-hidden="true" /> No se pudo consultar. Revise su conexión.</div>
        )}
        {status === 'listo' && quakes.length === 0 && (
          <div className="real-map__placeholder"><Activity size={22} aria-hidden="true" /> No hay sismos registrados en este periodo.</div>
        )}
        {status === 'listo' && quakes.length > 0 && (
          <ul className="quake-list">
            {quakes.map((q) => (
              <li key={q.id} className="quake-row">
                <span className={`quake-mag ${magnitudeTone(q.magnitude)}`}>{q.magnitude.toFixed(1)}</span>
                <div>
                  <strong>{q.place}</strong>
                  <small>
                    {new Date(q.time).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    {` · ${Math.round(q.depthKm)} km de profundidad`}
                    {q.distanceKm != null && ` · a ${Math.round(q.distanceKm)} km`}
                  </small>
                </div>
                {q.url && (
                  <a className="icon-btn icon-btn--soft" href={q.url} target="_blank" rel="noopener noreferrer" aria-label="Ver detalle en el USGS">
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="btn btn--outline btn--block" onClick={() => void load()} disabled={status === 'cargando'}>
        <RefreshCw size={18} aria-hidden="true" /> Actualizar
      </button>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> Fuente</h2>
        <ul className="bullets">
          <li>Datos del Servicio Geológico de EE. UU. (USGS), catálogo público y gratuito. Pueden tardar unos minutos en aparecer.</li>
          <li>Para información oficial en Colombia consulte el Servicio Geológico Colombiano (sgc.gov.co).</li>
          <li>Su ubicación no se envía: se descarga el listado general y se filtra en este dispositivo.</li>
          <li>SISMO no detecta ni predice sismos.</li>
        </ul>
      </section>
    </AppLayout>
  );
}
