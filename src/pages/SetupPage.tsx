// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonContent, IonInput, IonPage, useIonRouter } from '@ionic/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Crosshair, Loader2, MapPin, Search, Siren, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ContactFormModal } from '../components/ContactFormModal';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { searchAddress, type AddressResult } from '../services/geocodeService';
import { requestDeviceLocation } from '../services/locationService';
import { requestSosDialog } from '../services/sosRequestService';
import { defaultSettings } from '../services/storageService';
import type { ContactInput } from '../types';
import { goToRoot } from '../utils/navigation';

const STEPS = ['name', 'location', 'meeting', 'contact'] as const;

/**
 * Registro obligatorio cuando se empieza sin modo de demostración: nombre, ubicación real del dispositivo,
 * punto de encuentro y al menos un contacto real. «Siguiente» se habilita solo con el paso completo y la app
 * no queda marcada como configurada (`onboarded`) hasta terminar. El SOS sigue disponible en todo momento.
 */
export default function SetupPage() {
  const router = useIonRouter();
  const { data, updateSettings, setLocation, setLocationPermission, setMeetingPoint, addContact } = useAppState();
  const { setup: t, settings: ts, location: tl } = useT();
  const [step, setStep] = useState(0);
  // El nombre por defecto («Usuario demo») no cuenta: la persona debe escribir el suyo.
  const [name, setName] = useState(data.settings.userName === defaultSettings.userName ? '' : data.settings.userName);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [label, setLabel] = useState(data.meetingPoint?.label ?? tl.meeting.defaultLabel);
  const [address, setAddress] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const { lastLocation, meetingPoint } = data;
  const deviceLocation = lastLocation?.source === 'dispositivo' ? lastLocation : null;
  const realContacts = data.contacts.filter((c) => !c.isSeed);
  const nameError = name.trim().length < 2 ? ts.profile.min : name.trim().length > 30 ? ts.profile.max : '';
  const labelError = label.trim().length < 2 ? tl.meeting.min : '';

  const done = [!nameError, !!deviceLocation, !!meetingPoint, realContacts.length > 0];
  const key = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (!done[step]) return;
    if (key === 'name') updateSettings({ userName: name.trim() });
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    updateSettings({ onboarded: true });
    router.push('/inicio', 'root', 'replace');
  };

  const locate = async () => {
    setLocating(true);
    setLocationMessage('');
    const result = await requestDeviceLocation();
    setLocating(false);
    if (result.snapshot) setLocation(result.snapshot, result.permission);
    else setLocationPermission(result.permission);
    setLocationMessage(result.snapshot ? t.locationOk : `${result.message} ${t.locationMissing}`);
  };

  const saveMeeting = (latitude: number, longitude: number, pointLabel = label.trim()) =>
    setMeetingPoint({ label: pointLabel, latitude, longitude });

  const search = async () => {
    setSearching(true);
    setSearchMessage('');
    setResults([]);
    try {
      const found = await searchAddress(address, deviceLocation);
      setResults(found);
      if (found.length === 0) setSearchMessage(tl.meeting.noResults);
    } catch {
      setSearchMessage(tl.meeting.searchError);
    } finally {
      setSearching(false);
    }
  };

  // Igual que en Ubicación: si no se cambió el nombre por defecto, se usa la dirección encontrada.
  const chooseAddress = (r: AddressResult) => {
    const pointLabel = label.trim() && label.trim() !== tl.meeting.defaultLabel ? label.trim() : r.shortLabel;
    setLabel(pointLabel);
    saveMeeting(r.latitude, r.longitude, pointLabel);
    setResults([]);
    setAddress('');
  };

  const saveContact = (input: ContactInput) => {
    addContact(input);
    setFormOpen(false);
  };

  // Emergencia durante el registro: misma ruta que el widget de Android (Inicio con el diálogo de SOS).
  const sos = () => {
    goToRoot(router, '/inicio');
    requestSosDialog();
  };

  return (
    <IonPage>
      <IonContent className="welcome">
        <main className="welcome__inner setup">
          <header className="stack">
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <button className="btn btn--danger btn--block" onClick={sos}>
              <Siren size={18} aria-hidden="true" /> {t.sos}
            </button>
            <small className="muted">{t.sosHint}</small>
          </header>

          <ol className="setup__progress" aria-label={t.stepOf(step + 1, STEPS.length)}>
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'is-current' : done[i] ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                {done[i] && i !== step ? <CheckCircle2 size={16} aria-hidden="true" /> : <span>{i + 1}</span>}
                <small>{t.steps[s]}</small>
              </li>
            ))}
          </ol>

          <section className="card stack">
            <small className="muted">{t.stepOf(step + 1, STEPS.length)}</small>
            <h2 className="card__title">{t.steps[key]}</h2>

            {key === 'name' && (
              <>
                <p className="small muted">{t.nameHint}</p>
                <IonInput
                  className={nameError ? 'ion-invalid ion-touched' : ''}
                  label={ts.profile.nameLabel}
                  labelPlacement="stacked"
                  fill="outline"
                  value={name}
                  maxlength={30}
                  errorText={nameError}
                  onIonInput={(e) => setName(String(e.detail.value ?? ''))}
                />
              </>
            )}

            {key === 'location' && (
              <>
                <p className="small muted">{t.locationHint}</p>
                <button className="btn btn--primary btn--block" onClick={locate} disabled={locating}>
                  {locating ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Crosshair size={18} aria-hidden="true" />}
                  {t.locationButton}
                </button>
                {deviceLocation && (
                  <p className="small" role="status">
                    <CheckCircle2 size={16} aria-hidden="true" /> {t.locationOk} ({deviceLocation.latitude.toFixed(5)}, {deviceLocation.longitude.toFixed(5)})
                  </p>
                )}
                {!deviceLocation && locationMessage && <p className="small muted" role="status">{locationMessage}</p>}
              </>
            )}

            {key === 'meeting' && (
              <>
                <p className="small muted">{t.meetingHint}</p>
                <IonInput
                  className={labelError ? 'ion-invalid ion-touched' : ''}
                  label={tl.meeting.nameLabel}
                  labelPlacement="stacked"
                  fill="outline"
                  maxlength={60}
                  placeholder={tl.meeting.placeholder}
                  value={label}
                  errorText={labelError}
                  onIonInput={(e) => setLabel(String(e.detail.value ?? ''))}
                />
                <button
                  className="btn btn--ghost btn--block"
                  onClick={() => deviceLocation && saveMeeting(deviceLocation.latitude, deviceLocation.longitude)}
                  disabled={!deviceLocation || !!labelError}
                >
                  <MapPin size={18} aria-hidden="true" /> {tl.meeting.current}
                </button>
                <form
                  className="address-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void search();
                  }}
                >
                  <IonInput
                    label={tl.meeting.addressLabel}
                    labelPlacement="stacked"
                    fill="outline"
                    maxlength={200}
                    placeholder={tl.meeting.addressPlaceholder}
                    value={address}
                    onIonInput={(e) => setAddress(String(e.detail.value ?? ''))}
                  />
                  <button type="submit" className="btn btn--primary" disabled={searching || address.trim().length < 3}>
                    {searching ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
                    {searching ? tl.meeting.searching : tl.meeting.search}
                  </button>
                </form>
                {searchMessage && <p className="small muted" role="status">{searchMessage}</p>}
                {results.length > 0 && (
                  <ul className="address-results">
                    {results.map((r) => (
                      <li key={`${r.latitude},${r.longitude}`}>
                        <button className="btn btn--ghost btn--block address-result" onClick={() => chooseAddress(r)}>
                          <MapPin size={16} aria-hidden="true" />
                          <span>
                            {r.label}
                            <small className="address-result__hint">{r.exact ? tl.meeting.exact : tl.meeting.approx}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {meetingPoint && (
                  <p className="small" role="status">
                    <CheckCircle2 size={16} aria-hidden="true" /> {t.meetingSaved(meetingPoint.label)}
                  </p>
                )}
              </>
            )}

            {key === 'contact' && (
              <>
                <p className="small muted">{t.contactHint}</p>
                <button className="btn btn--primary btn--block" onClick={() => setFormOpen(true)}>
                  <UserPlus size={18} aria-hidden="true" /> {t.contactAdd}
                </button>
                {realContacts.length > 0 && (
                  <>
                    <p className="small" role="status"><CheckCircle2 size={16} aria-hidden="true" /> {t.contactCount(realContacts.length)}</p>
                    <ul className="small">
                      {realContacts.map((c) => <li key={c.id}>{c.name} · {c.phone}</li>)}
                    </ul>
                  </>
                )}
              </>
            )}
          </section>

          <div className="setup__nav">
            <button className="btn btn--ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft size={18} aria-hidden="true" /> {t.back}
            </button>
            <button className="btn btn--primary" onClick={next} disabled={!done[step]}>
              {isLast ? t.finish : t.next} <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </main>
      </IonContent>
      <ContactFormModal isOpen={formOpen} contact={null} onSave={saveContact} onClose={() => setFormOpen(false)} />
    </IonPage>
  );
}
