// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonLabel, IonSegment, IonSegmentButton, useIonToast } from '@ionic/react';
import { Crosshair, ExternalLink, Flag, FlaskConical, Info, Loader2, MapPinned, MapPinOff, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { LocationMap } from '../components/LocationMap';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { useAppState } from '../context/appContext';
import { testLocation } from '../services/demoData';
import { checkLocationPermission, requestDeviceLocation } from '../services/locationService';
import { formatCoord } from '../utils/format';

// Leaflet solo se descarga cuando se abre la pestaña «Mapa real».
const RealMap = lazy(() => import('../components/RealMap'));

type MapTab = 'esquema' | 'real';

export default function LocationPage() {
  const [presentToast] = useIonToast();
  const { data, setLocation, setLocationPermission, setMeetingPoint } = useAppState();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<MapTab>('esquema');
  const { lastLocation, locationPermission, meetingPoint } = data;
  const [label, setLabel] = useState(meetingPoint?.label ?? 'Punto de encuentro');
  const [picking, setPicking] = useState(false);
  const labelError = label.trim().length < 2 ? 'Mínimo 2 caracteres.' : '';

  useEffect(() => {
    checkLocationPermission().then((p) => {
      if (p !== 'sin_solicitar') setLocationPermission(p);
    });
  }, [setLocationPermission]);

  const request = async () => {
    setLoading(true);
    const result = await requestDeviceLocation();
    setLoading(false);
    if (result.snapshot) setLocation(result.snapshot, result.permission);
    else setLocationPermission(result.permission);
    presentToast({ message: result.message, duration: 2800, color: result.snapshot ? 'success' : 'warning', position: 'top' });
  };

  const saveMeeting = (latitude: number, longitude: number) => {
    setMeetingPoint({ label: label.trim(), latitude, longitude });
    setPicking(false);
    presentToast({ message: 'Punto de encuentro guardado.', duration: 2200, color: 'success', position: 'top' });
  };

  const useCurrentAsMeeting = () => {
    if (lastLocation) saveMeeting(lastLocation.latitude, lastLocation.longitude);
  };

  const togglePicking = () => {
    setPicking((p) => !p);
    setTab('real');
  };

  const pickOnMap = (latitude: number, longitude: number) => saveMeeting(latitude, longitude);

  const useTest = () => {
    setLocation(testLocation());
    presentToast({ message: 'Se cargaron coordenadas de PRUEBA (no son su posición).', duration: 2800, color: 'medium', position: 'top' });
  };

  const osmUrl = lastLocation
    ? `https://www.openstreetmap.org/?mlat=${lastLocation.latitude}&mlon=${lastLocation.longitude}#map=16/${lastLocation.latitude}/${lastLocation.longitude}`
    : null;

  return (
    <AppLayout title="Ubicación" backTo="/inicio">
      <LocationStatusCard snapshot={lastLocation} permission={locationPermission} />

      <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as MapTab)} className="segment">
        <IonSegmentButton value="esquema"><IonLabel>Esquema</IonLabel></IonSegmentButton>
        <IonSegmentButton value="real"><IonLabel>Mapa real</IonLabel></IonSegmentButton>
      </IonSegment>

      <section className="card card--flush">
        {tab === 'esquema' ? (
          <LocationMap snapshot={lastLocation} />
        ) : lastLocation ? (
          <Suspense fallback={<div className="real-map__placeholder"><Loader2 size={22} className="spin" aria-hidden="true" /> Cargando mapa…</div>}>
            <RealMap snapshot={lastLocation} meetingPoint={meetingPoint} onPick={picking ? pickOnMap : undefined} />
          </Suspense>
        ) : (
          <div className="real-map__placeholder">
            <MapPinOff size={22} aria-hidden="true" /> Solicite su ubicación para verla en el mapa.
          </div>
        )}
      </section>

      <div className="stack">
        <button className="btn btn--primary btn--block" onClick={request} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Crosshair size={18} aria-hidden="true" />}
          {loading ? 'Afinando ubicación (hasta 10 s)…' : 'Solicitar mi ubicación'}
        </button>
        <button className="btn btn--outline btn--block" onClick={useTest}>
          <FlaskConical size={18} aria-hidden="true" /> Usar coordenadas de prueba
        </button>
        {lastLocation && (
          <div className="btn-pair">
            {osmUrl && (
              <a className="btn btn--ghost" href={osmUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} aria-hidden="true" /> Ver en OpenStreetMap
              </a>
            )}
            <button className="btn btn--ghost" onClick={() => setLocation(null)}>
              <Trash2 size={16} aria-hidden="true" /> Borrar
            </button>
          </div>
        )}
      </div>

      <section className="card stack">
        <h2 className="card__title"><Flag size={18} aria-hidden="true" /> Punto de encuentro</h2>
        <p className="small muted">
          {meetingPoint
            ? `${meetingPoint.label} · ${formatCoord(meetingPoint.latitude)}, ${formatCoord(meetingPoint.longitude)}. Se incluye en el SMS de alerta.`
            : 'El lugar donde su familia acordó reunirse. Se incluirá en el SMS de alerta.'}
        </p>
        <IonInput
          className={labelError ? 'ion-invalid ion-touched' : ''}
          label="Nombre del punto"
          labelPlacement="stacked"
          fill="outline"
          maxlength={40}
          placeholder="Ej.: Parque del barrio"
          value={label}
          errorText={labelError}
          onIonInput={(e) => setLabel(String(e.detail.value ?? ''))}
        />
        {picking && <p className="callout callout--info small">Toque el mapa real para marcar el punto de encuentro.</p>}
        <div className="btn-pair">
          <button className="btn btn--outline" onClick={useCurrentAsMeeting} disabled={!!labelError || !lastLocation || lastLocation.source !== 'dispositivo'}>
            <Crosshair size={16} aria-hidden="true" /> Mi ubicación actual
          </button>
          <button className={`btn ${picking ? 'btn--dark' : 'btn--outline'}`} onClick={togglePicking} disabled={!!labelError || !lastLocation}>
            <MapPinned size={16} aria-hidden="true" /> {picking ? 'Cancelar' : 'Elegir en el mapa'}
          </button>
        </div>
        {meetingPoint && (
          <button className="btn btn--ghost btn--block" onClick={() => setMeetingPoint(null)}>
            <Trash2 size={16} aria-hidden="true" /> Quitar punto de encuentro
          </button>
        )}
      </section>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> Limitaciones de la geolocalización</h2>
        <ul className="bullets">
          <li>La precisión depende del GPS, la red y el entorno; en interiores puede variar decenas o cientos de metros.</li>
          <li>El navegador solo permite la ubicación en sitios seguros (HTTPS o localhost) y con su autorización.</li>
          <li>La ubicación se guarda solo en este dispositivo y se adjunta a la alerta local.</li>
          <li>La pestaña «Esquema» es un dibujo y funciona sin internet. «Mapa real» descarga el mapa de OpenStreetMap: requiere conexión y revela a ese servicio la zona aproximada que se está viendo.</li>
        </ul>
      </section>
    </AppLayout>
  );
}
