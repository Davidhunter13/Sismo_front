// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { ExternalLink, Loader2, Route } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useT } from '../i18n/useT';
import { isNative } from '../services/nativeBridge';
import { useOnline } from '../services/networkService';
import { fetchRoute, formatDistance, formatDuration, googleMapsUrl, wazeUrl, type RouteResult, type TravelMode } from '../services/routeService';
import type { MeetingPoint } from '../types';

// Leaflet solo se descarga si se muestra la ruta.
const RouteMap = lazy(() => import('./RouteMap'));

interface Props {
  meetingPoint: MeetingPoint;
  from: { latitude: number; longitude: number } | null;
}

type Status = 'cargando' | 'listo' | 'sin_ruta' | 'error';

/**
 * Ruta al punto de encuentro: mapa con el trazado, modo a pie / carro o moto / bici, distancia y tiempo,
 * y botón para abrirla en Google Maps (guía paso a paso). Requiere internet; la brújula no.
 */
export function MeetingRoute({ meetingPoint, from }: Props) {
  const t = useT().features.route;
  const online = useOnline();
  const [mode, setMode] = useState<TravelMode>('foot');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [status, setStatus] = useState<Status>('cargando');

  const fromKey = from ? `${from.latitude.toFixed(5)},${from.longitude.toFixed(5)}` : '';
  const toKey = `${meetingPoint.latitude.toFixed(5)},${meetingPoint.longitude.toFixed(5)}`;

  useEffect(() => {
    if (!from || !online) return;
    let cancelled = false;
    setStatus('cargando');
    setRoute(null);
    fetchRoute(mode, from, meetingPoint)
      .then((r) => {
        if (cancelled) return;
        setRoute(r);
        setStatus(r ? 'listo' : 'sin_ruta');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
    // fromKey/toKey resumen las coordenadas para no recalcular en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fromKey, toKey, online]);

  if (!from) return <p className="small muted">{t.needLocation}</p>;

  return (
    <div className="stack">
      <IonSegment value={mode} onIonChange={(e) => setMode(e.detail.value as TravelMode)} className="segment" aria-label={t.modeLabel}>
        <IonSegmentButton value="foot"><IonLabel>{t.foot}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="car"><IonLabel>{t.car}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="bike"><IonLabel>{t.bike}</IonLabel></IonSegmentButton>
      </IonSegment>

      {!online ? (
        <p className="callout callout--warning small">{t.offline}</p>
      ) : (
        <>
          <div className="route-summary" role="status">
            {status === 'cargando' && (<><Loader2 size={18} className="spin" aria-hidden="true" /> {t.loading}</>)}
            {status === 'listo' && route && (
              <><Route size={18} aria-hidden="true" /> <strong>{formatDistance(route.distance)}</strong> · {t.time(formatDuration(route.duration))}</>
            )}
            {status === 'sin_ruta' && t.noRoute}
            {status === 'error' && t.error}
          </div>
          <Suspense fallback={<div className="real-map__placeholder"><Loader2 size={22} className="spin" aria-hidden="true" /></div>}>
            <RouteMap from={from} to={meetingPoint} path={route?.path ?? null} />
          </Suspense>
        </>
      )}

      <a className="btn btn--outline btn--block" href={googleMapsUrl(mode, from, meetingPoint)} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={18} aria-hidden="true" /> {t.openGoogle}
      </a>
      {mode === 'car' && (
        <a className="btn btn--outline btn--block" href={wazeUrl(meetingPoint, from, isNative())} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={18} aria-hidden="true" /> {t.openWaze}
        </a>
      )}
      <p className="small muted">{t.note}</p>
    </div>
  );
}
