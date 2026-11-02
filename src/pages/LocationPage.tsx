// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton, useIonToast } from '@ionic/react';
import { Crosshair, ExternalLink, FlaskConical, Info, Loader2, MapPinOff, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { LocationMap } from '../components/LocationMap';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { useAppState } from '../context/appContext';
import { testLocation } from '../services/demoData';
import { checkLocationPermission, requestDeviceLocation } from '../services/locationService';

// Leaflet solo se descarga cuando se abre la pestaña «Mapa real».
const RealMap = lazy(() => import('../components/RealMap'));

type MapTab = 'esquema' | 'real';

export default function LocationPage() {
  const [presentToast] = useIonToast();
  const { data, setLocation, setLocationPermission } = useAppState();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<MapTab>('esquema');
  const { lastLocation, locationPermission } = data;

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
            <RealMap snapshot={lastLocation} />
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
