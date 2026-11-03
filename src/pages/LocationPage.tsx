// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonLabel, IonSegment, IonSegmentButton, useIonToast } from '@ionic/react';
import { Crosshair, ExternalLink, Flag, FlaskConical, Info, Loader2, MapPin, MapPinned, MapPinOff, Navigation, Search, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LocationMap } from '../components/LocationMap';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { MeetingCompass } from '../components/MeetingCompass';
import { useT } from '../i18n/useT';
import { useAppState } from '../context/appContext';
import { testLocation } from '../services/demoData';
import { searchAddress, type AddressResult } from '../services/geocodeService';
import { checkLocationPermission, requestDeviceLocation } from '../services/locationService';
import { formatCoord } from '../utils/format';

// Leaflet solo se descarga cuando se abre la pestaña «Mapa real».
const RealMap = lazy(() => import('../components/RealMap'));

type MapTab = 'esquema' | 'real';

export default function LocationPage() {
  const [presentToast] = useIonToast();
  const { data, setLocation, setLocationPermission, setMeetingPoint } = useAppState();
  const { features: tf, location: t } = useT();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<MapTab>('esquema');
  const { lastLocation, locationPermission, meetingPoint } = data;
  const [label, setLabel] = useState(meetingPoint?.label ?? t.meeting.defaultLabel);
  const [picking, setPicking] = useState(false);
  const labelError = label.trim().length < 2 ? t.meeting.min : '';

  useEffect(() => {
    checkLocationPermission().then((p) => {
      if (p !== 'sin_solicitar') setLocationPermission(p);
    });
  }, [setLocationPermission]);

  // Acceso «Brújula» de Inicio (?ver=brujula): baja hasta la tarjeta de la brújula al terminar la transición.
  const { search } = useLocation();
  const showCompass = new URLSearchParams(search).get('ver') === 'brujula';
  useEffect(() => {
    if (!showCompass) return;
    const timer = window.setTimeout(() => document.getElementById('brujula')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
    return () => window.clearTimeout(timer);
  }, [showCompass]);

  const request = async () => {
    setLoading(true);
    const result = await requestDeviceLocation();
    setLoading(false);
    if (result.snapshot) setLocation(result.snapshot, result.permission);
    else setLocationPermission(result.permission);
    presentToast({ message: result.message, duration: 2800, color: result.snapshot ? 'success' : 'warning', position: 'top' });
  };

  // Sube hasta el mapa (al elegir en él o tras buscar una dirección), esperando a que se dibuje.
  const scrollToMap = () =>
    window.setTimeout(() => document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);

  const saveMeeting = (latitude: number, longitude: number, name = label.trim()) => {
    setMeetingPoint({ label: name, latitude, longitude });
    setPicking(false);
    presentToast({ message: t.meeting.saved, duration: 2200, color: 'success', position: 'top' });
  };

  const useCurrentAsMeeting = () => {
    if (lastLocation) saveMeeting(lastLocation.latitude, lastLocation.longitude);
  };

  const togglePicking = () => {
    const next = !picking;
    setPicking(next);
    setTab('real');
    if (next) scrollToMap();
  };

  const [address, setAddress] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  const searchMeetingAddress = async () => {
    setSearching(true);
    setSearchMessage('');
    setResults([]);
    try {
      const found = await searchAddress(address, lastLocation?.source === 'dispositivo' ? lastLocation : null);
      setResults(found);
      if (found.length === 0) setSearchMessage(t.meeting.noResults);
    } catch {
      setSearchMessage(t.meeting.searchError);
    } finally {
      setSearching(false);
    }
  };

  // Si el usuario no cambió el nombre por defecto, se usa la dirección encontrada como nombre del punto.
  const chooseAddress = (r: AddressResult) => {
    const name = label.trim() && label.trim() !== t.meeting.defaultLabel ? label.trim() : r.shortLabel;
    setLabel(name);
    saveMeeting(r.latitude, r.longitude, name);
    setResults([]);
    setAddress('');
    if (lastLocation) {
      setTab('real');
      scrollToMap();
    }
  };

  const pickOnMap = (latitude: number, longitude: number) => saveMeeting(latitude, longitude);

  const useTest = () => {
    setLocation(testLocation());
    presentToast({ message: t.testLoaded, duration: 2800, color: 'medium', position: 'top' });
  };

  const osmUrl = lastLocation
    ? `https://www.openstreetmap.org/?mlat=${lastLocation.latitude}&mlon=${lastLocation.longitude}#map=16/${lastLocation.latitude}/${lastLocation.longitude}`
    : null;

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <LocationStatusCard snapshot={lastLocation} permission={locationPermission} />

      <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as MapTab)} className="segment">
        <IonSegmentButton value="esquema"><IonLabel>{t.tabSketch}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="real"><IonLabel>{t.tabReal}</IonLabel></IonSegmentButton>
      </IonSegment>

      <section className="card card--flush" id="mapa">
        {tab === 'esquema' ? (
          <LocationMap snapshot={lastLocation} />
        ) : lastLocation ? (
          <Suspense fallback={<div className="real-map__placeholder"><Loader2 size={22} className="spin" aria-hidden="true" /> {t.loadingMap}</div>}>
            <RealMap snapshot={lastLocation} meetingPoint={meetingPoint} onPick={picking ? pickOnMap : undefined} />
          </Suspense>
        ) : (
          <div className="real-map__placeholder">
            <MapPinOff size={22} aria-hidden="true" /> {t.requestFirst}
          </div>
        )}
      </section>

      <div className="stack">
        <button className="btn btn--primary btn--block" onClick={request} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Crosshair size={18} aria-hidden="true" />}
          {loading ? t.refining : t.request}
        </button>
        <button className="btn btn--outline btn--block" onClick={useTest}>
          <FlaskConical size={18} aria-hidden="true" /> {t.useTest}
        </button>
        {lastLocation && (
          <div className="btn-pair">
            {osmUrl && (
              <a className="btn btn--ghost" href={osmUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} aria-hidden="true" /> {t.openOsm}
              </a>
            )}
            <button className="btn btn--ghost" onClick={() => setLocation(null)}>
              <Trash2 size={16} aria-hidden="true" /> {t.clear}
            </button>
          </div>
        )}
      </div>

      <section className="card stack">
        <h2 className="card__title"><Flag size={18} aria-hidden="true" /> {t.meeting.title}</h2>
        <p className="small muted">
          {meetingPoint
            ? t.meeting.summary(meetingPoint.label, `${formatCoord(meetingPoint.latitude)}, ${formatCoord(meetingPoint.longitude)}`)
            : t.meeting.empty}
        </p>
        <IonInput
          className={labelError ? 'ion-invalid ion-touched' : ''}
          label={t.meeting.nameLabel}
          labelPlacement="stacked"
          fill="outline"
          maxlength={40}
          placeholder={t.meeting.placeholder}
          value={label}
          errorText={labelError}
          onIonInput={(e) => setLabel(String(e.detail.value ?? ''))}
        />
        {picking && <p className="callout callout--info small">{t.meeting.pickHint}</p>}
        <div className="btn-pair">
          <button className="btn btn--outline" onClick={useCurrentAsMeeting} disabled={!!labelError || !lastLocation || lastLocation.source !== 'dispositivo'}>
            <Crosshair size={16} aria-hidden="true" /> {t.meeting.current}
          </button>
          <button className={`btn ${picking ? 'btn--dark' : 'btn--outline'}`} onClick={togglePicking} disabled={!!labelError || !lastLocation}>
            <MapPinned size={16} aria-hidden="true" /> {picking ? t.meeting.cancel : t.meeting.pick}
          </button>
        </div>
        {/* Un botón bloqueado sin explicación confunde: se dice por qué y qué hacer. */}
        {!labelError && !lastLocation && <p className="small muted" role="note">{t.meeting.needLocation}</p>}
        {!labelError && lastLocation?.source === 'prueba' && <p className="small muted" role="note">{t.meeting.testNotAllowed}</p>}
        <form
          className="address-search"
          onSubmit={(e) => {
            e.preventDefault();
            void searchMeetingAddress();
          }}
        >
          <IonInput
            label={t.meeting.addressLabel}
            labelPlacement="stacked"
            fill="outline"
            maxlength={200}
            placeholder={t.meeting.addressPlaceholder}
            value={address}
            onIonInput={(e) => setAddress(String(e.detail.value ?? ''))}
          />
          <button type="submit" className="btn btn--primary" disabled={searching || address.trim().length < 3}>
            {searching ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
            {searching ? t.meeting.searching : t.meeting.search}
          </button>
        </form>
        {searchMessage && <p className="small muted" role="status">{searchMessage}</p>}
        {results.length > 0 && (
          <div className="stack">
            <p className="small"><strong>{t.meeting.resultsTitle}</strong></p>
            <ul className="address-results">
              {results.map((r) => (
                <li key={`${r.latitude},${r.longitude}`}>
                  <button className="btn btn--ghost btn--block address-result" onClick={() => chooseAddress(r)}>
                    <MapPin size={16} aria-hidden="true" />
                    <span>
                      {r.label}
                      <small className="address-result__hint">{r.exact ? t.meeting.exact : t.meeting.approx}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="small muted">{t.meeting.addressPrivacy}</p>
        {meetingPoint && (
          <button className="btn btn--ghost btn--block" onClick={() => setMeetingPoint(null)}>
            <Trash2 size={16} aria-hidden="true" /> {t.meeting.remove}
          </button>
        )}
      </section>

      {/* Siempre visible: sin punto de encuentro, la tarjeta indica cómo activarla. */}
      <section className="card" id="brujula">
        <h2 className="card__title"><Navigation size={18} aria-hidden="true" /> {tf.compass.title}</h2>
        <MeetingCompass meetingPoint={meetingPoint} fallback={lastLocation} />
      </section>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> {t.limitsTitle}</h2>
        <ul className="bullets">
          {t.limits.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>
    </AppLayout>
  );
}
