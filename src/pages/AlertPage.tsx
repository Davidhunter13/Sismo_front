// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonToggle, useIonRouter, useIonToast } from '@ionic/react';
import {
  BatteryLow, BellOff, CheckCircle2, ClipboardList, Navigation, Eye, Flashlight, FlashlightOff, HeartPulse, MessageCircle, MessageSquare, Phone, Radio, Send, ShieldCheck, Siren, Smartphone,
  Timer, Volume2, VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { AlertEmailCard } from '../components/AlertEmailCard';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { MedicalQr } from '../components/MedicalQr';
import { MeetingCompass } from '../components/MeetingCompass';
import { NetworkBanner } from '../components/NetworkBanner';
import { HelpStatusBanner } from '../components/HelpStatusBanner';
import { useT } from '../i18n/useT';
import { getEmergencyNumber } from '../i18n';
import { DemoBadge, LocalBadge, StatusBadge } from '../components/StatusBadge';
import { deliveryBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { getBatteryLevel } from '../services/batteryService';
import { formatMs, metricValue } from '../services/metricsService';
import { isNative } from '../services/nativeBridge';
import { keepScreenOn } from '../services/screenService';
import { isTrapped, startTrapped, stopTrapped, TRAPPED_INTERVAL_MS } from '../services/trappedService';
import { refreshNativeSignals, startAlertSignals } from '../services/signalsService';
import { isSirenPlaying, isSirenSupported, startSiren, stopSiren } from '../services/sirenService';
import { buildAlertEmail, emailRecipients, locationEmailDue, sendAlertEmail, type EmailKind } from '../services/emailService';
import { buildAlertMessage, buildLowBatteryMessage, openSmsComposer, openWhatsapp } from '../services/smsService';
import { useNotifySafe } from '../components/useNotifySafe';
import { useContactChannel } from '../components/useContactChannel';
import { useMeetingTarget } from '../components/useMeetingTarget';
import type { Contact } from '../types';
import { isTorchApiAvailable, isTorchOn, startTorchBlink, stopTorch } from '../services/torchService';
import { isVibrating, isVibrationSupported, startVibration, stopVibration } from '../services/vibrationService';
import { eventTypeLabel, formatDuration, formatTime } from '../utils/format';
import { goToRoot } from '../utils/navigation';

/** Cada cuánto se revisa la batería durante una alerta (ahorro automático). */
const BATTERY_CHECK_MS = 60_000;
/**
 * Alerta en la que ya se activó el ahorro automático: no se repite aunque se salga de esta vista o la app se
 * reinicie. Se guarda aparte (solo el id de la alerta), sin tocar los datos de la alerta.
 */
/** Avisos por correo ya pedidos en esta sesión (alerta:tipo); el servidor además evita repetirlos. */
const followUpsRequested = new Set<string>();

const AUTO_SAVER_KEY = 'sismo:v1:ahorro-automatico';
const autoSaverDone = {
  has: (id: string) => {
    try {
      return localStorage.getItem(AUTO_SAVER_KEY) === id;
    } catch {
      return false;
    }
  },
  add: (id: string) => {
    try {
      localStorage.setItem(AUTO_SAVER_KEY, id);
    } catch {
      // Sin almacenamiento: solo se pierde el recuerdo tras reiniciar la app.
    }
  },
};

export default function AlertPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const notifySafe = useNotifySafe();
  const chooseChannel = useContactChannel();
  const tf = useT().features;
  const ta = useT().alert;
  const { data, activeAlert, endAlert, markSmsOpened, updateActiveAlert } = useAppState();
  // Brújula de la alerta: hacia el punto de encuentro más cercano a donde se activó (o la última ubicación).
  const meeting = useMeetingTarget(activeAlert?.location ?? data.lastLocation);
  // Los contactos de demostración son ficticios: no se les envía SMS.
  const smsContacts = data.contacts.filter((c) => !c.isSeed);
  const [flash, setFlash] = useState(data.settings.visualSignalEnabled && !data.settings.reduceMotion);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [, tick] = useState(0);
  // Las señales se inician al confirmar el SOS y siguen aunque se salga de esta vista,
  // hasta que el usuario las apague o finalice la alerta.
  const playing = isSirenPlaying();
  const torchOn = isTorchOn();
  const vibrating = isVibrating();
  const trapped = isTrapped();

  // Ahorro automático: con la batería en el umbral de Configuración pasa sola al modo ahorro (una sola vez por
  // alerta: si la persona vuelve a la señal continua, se respeta). No aplica en simulacros.
  const [lowBattery, setLowBattery] = useState<number | null>(null);
  const threshold = data.settings.lowBatterySaver;
  const alertId = activeAlert && !activeAlert.isDrill ? activeAlert.id : null;
  useEffect(() => {
    if (!alertId || threshold <= 0) return;
    const check = async () => {
      if (autoSaverDone.has(alertId) || isTrapped()) return;
      const level = await getBatteryLevel();
      if (level == null || level > threshold || autoSaverDone.has(alertId)) return;
      autoSaverDone.add(alertId);
      setFlash(false);
      await startTrapped();
      setLowBattery(level);
      tick((n) => n + 1);
    };
    void check();
    const t = window.setInterval(() => void check(), BATTERY_CHECK_MS);
    return () => window.clearInterval(t);
  }, [alertId, threshold]);

  // Prioridad para el centro de monitoreo: modo atrapado y batería viajan con la alerta (el panel las muestra).
  const activeId = activeAlert?.id;
  useEffect(() => {
    if (activeId) updateActiveAlert({ trapped });
  }, [activeId, trapped, updateActiveAlert]);
  const savedBattery = activeAlert?.batteryLevel;
  useEffect(() => {
    if (!activeId) return;
    const read = async () => {
      const level = await getBatteryLevel();
      // Solo cuando cambia el porcentaje (no en cada lectura), para no sincronizar de más.
      if (level != null && level !== savedBattery) updateActiveAlert({ batteryLevel: level, batteryAt: new Date().toISOString() });
    };
    void read();
    const t = window.setInterval(() => void read(), BATTERY_CHECK_MS);
    return () => window.clearInterval(t);
  }, [activeId, savedBattery, updateActiveAlert]);

  // Avisos por correo durante la alerta (además del de «activó la alarma»): ayuda urgente, modo atrapado y batería
  // baja. Una vez por alerta y tipo, nunca en simulacros. Si la persona canceló el correo inicial, no se envían los
  // automáticos (atrapado y batería); el de ayuda urgente sí, porque lo pide ella.
  const alertRef = useRef(activeAlert);
  alertRef.current = activeAlert;
  const hasEmailContacts = emailRecipients(data.contacts).length > 0;
  const sendFollowUp = useCallback(async (kind: Exclude<EmailKind, 'alerta' | 'caida' | 'ubicacion'>, battery: number | null) => {
    const a = alertRef.current;
    if (!a || a.isDrill || !hasEmailContacts) return;
    if (kind !== 'urgente' && a.emailStatus === 'cancelado') return;
    const key = `${a.id}:${kind}`;
    if (followUpsRequested.has(key) || a.followUpEmails?.[kind] === 'enviado') return;
    followUpsRequested.add(key);
    const status = await sendAlertEmail(buildAlertEmail(a, data.settings.userName, data.meetingPoints, data.medical, battery, kind));
    const latest = alertRef.current;
    if (latest?.id === a.id) updateActiveAlert({ followUpEmails: { ...latest.followUpEmails, [kind]: status } });
  }, [hasEmailContacts, data.settings.userName, data.meetingPoints, data.medical, updateActiveAlert]);
  const urgentNow = !!activeAlert?.urgent;
  useEffect(() => {
    if (urgentNow) void getBatteryLevel().then((b) => sendFollowUp('urgente', b));
  }, [activeId, urgentNow, sendFollowUp]);
  useEffect(() => {
    // Si lo activó el ahorro automático por batería, basta el aviso de batería baja.
    if (trapped && activeId && !autoSaverDone.has(activeId)) void getBatteryLevel().then((b) => sendFollowUp('atrapado', b));
  }, [activeId, trapped, sendFollowUp]);
  useEffect(() => {
    if (lowBattery != null) void sendFollowUp('bateria', lowBattery);
  }, [activeId, lowBattery, sendFollowUp]);

  // Ubicación actualizada por correo (sin cron: se decide con cada ubicación nueva que registra la alerta). Solo si el
  // correo inicial se envió, la persona se desplazó al menos LOCATION_EMAIL_MIN_METERS y pasaron LOCATION_EMAIL_MIN_MINUTES
  // desde la última ubicación enviada (el servidor también exige ese intervalo).
  const loc = activeAlert?.location;
  useEffect(() => {
    const a = alertRef.current;
    if (!a || a.isDrill || !loc || a.emailStatus !== 'enviado' || !hasEmailContacts) return;
    const due = locationEmailDue(a.lastEmailedLocation, loc);
    if (due === 'base') {
      // Punto de partida: la ubicación que llevaba el correo inicial.
      updateActiveAlert({ lastEmailedLocation: { latitude: loc.latitude, longitude: loc.longitude, at: new Date().toISOString() } });
      return;
    }
    if (due !== 'enviar') return;
    const key = `${a.id}:ubicacion:${a.lastEmailedLocation?.at}`;
    if (followUpsRequested.has(key)) return;
    followUpsRequested.add(key);
    void getBatteryLevel().then(async (battery) => {
      const status = await sendAlertEmail(buildAlertEmail(a, data.settings.userName, data.meetingPoints, data.medical, battery, 'ubicacion'));
      const latest = alertRef.current;
      if (latest?.id !== a.id) return;
      updateActiveAlert({
        followUpEmails: { ...latest.followUpEmails, ubicacion: status },
        ...(status === 'enviado' ? { lastEmailedLocation: { latitude: loc.latitude, longitude: loc.longitude, at: new Date().toISOString() } } : {}),
      });
    });
  }, [loc, activeAlert?.emailStatus, hasEmailContacts, data.settings.userName, data.meetingPoints, data.medical, updateActiveAlert]);

  const askUrgentHelp = (urgent: boolean) => {
    updateActiveAlert(urgent ? { urgent: true, urgentAt: new Date().toISOString() } : { urgent: false });
    if (urgent) presentToast({ message: ta.urgent.toast, duration: 3500, color: 'danger', position: 'top' });
  };

  const notifyLowBattery = () => {
    if (!activeAlert || lowBattery == null) return;
    const location = activeAlert.location ?? data.lastLocation;
    chooseChannel(ta.lowBattery.sheetHeader, async () =>
      buildLowBatteryMessage(data.settings.userName, (await getBatteryLevel()) ?? lowBattery, location, data.meetingPoints),
    );
  };

  // Reloj para la duración; también refresca el estado real de las señales (en Android se pueden
  // apagar desde la notificación).
  useEffect(() => {
    const t = window.setInterval(() => {
      void refreshNativeSignals().then(() => tick((n) => n + 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const alertMessage = async () => {
    if (!activeAlert) return '';
    const battery = await getBatteryLevel();
    return buildAlertMessage(data.settings.userName, activeAlert.eventType, activeAlert.location, data.meetingPoints, data.medical, battery);
  };

  const sendSms = async () => {
    if (!activeAlert) return;
    markSmsOpened();
    openSmsComposer(smsContacts, await alertMessage());
  };

  const sendWhatsapp = async (contact: Contact) => {
    if (!activeAlert) return;
    openWhatsapp(contact, await alertMessage());
  };

  const toggleSound = async () => {
    if (playing) stopSiren();
    else await startSiren(data.settings.alarmSound);
    tick((n) => n + 1);
  };

  const toggleTrapped = async () => {
    if (trapped) {
      // Al salir se retoma la alerta normal: señales continuas según la configuración y pantalla encendida.
      await stopTrapped();
      await keepScreenOn(true);
      startAlertSignals(data.settings);
      setFlash(data.settings.visualSignalEnabled && !data.settings.reduceMotion);
    } else {
      setFlash(false);
      await startTrapped();
    }
    tick((n) => n + 1);
  };

  const toggleVibration = async () => {
    if (vibrating) stopVibration();
    else if (!(await startVibration())) {
      presentToast({ message: ta.toast.noVibration, duration: 3000, color: 'warning', position: 'top' });
    }
    tick((n) => n + 1);
  };

  const toggleTorch = async () => {
    if (torchOn) {
      stopTorch();
    } else {
      const result = await startTorchBlink();
      if (result !== 'ok') {
        const message = result === 'denied'
          ? ta.toast.torchDenied
          : ta.toast.torchUnsupported;
        presentToast({ message, duration: 3000, color: 'warning', position: 'top' });
      }
    }
    tick((n) => n + 1);
  };

  // Al finalizar se pasa a la lista «Después del sismo» (reemplaza la vista de alerta; «Volver» lleva a Inicio).
  const goAfterAlert = (alertId: string) => {
    router.push(`/despues-del-sismo?alerta=${encodeURIComponent(alertId)}`, 'forward', 'replace');
  };

  const finish = () => {
    if (!activeAlert) return;
    const { eventType, isDrill, id, location } = activeAlert;
    setFlash(false);
    endAlert();
    presentToast({ message: ta.toast.finished, duration: 2500, color: 'success', position: 'top' });
    // Tras un simulacro no se avisa a la familia: se ofrece la encuesta de usabilidad.
    if (isDrill) {
      router.push(`/encuesta?alerta=${encodeURIComponent(id)}`, 'forward', 'replace');
      return;
    }
    if (smsContacts.length === 0) {
      goAfterAlert(id);
      return;
    }
    // Cierre del ciclo de comunicación: elegir por dónde avisar «Estoy bien» (SMS o WhatsApp por contacto).
    notifySafe(eventType, () => goAfterAlert(id), location ?? data.lastLocation);
  };

  if (!activeAlert) {
    return (
      <AppLayout title={ta.empty.title} backTo="/inicio">
        <section className="card empty-state">
          <ShieldCheck size={44} aria-hidden="true" />
          <h2>{ta.empty.heading}</h2>
          <p className="muted">{ta.empty.text}</p>
          <button className="btn btn--primary" onClick={() => goToRoot(router, '/inicio')}>{ta.empty.goHome}</button>
        </section>
      </AppLayout>
    );
  }

  const delivery = deliveryBadge[activeAlert.digitalStatus];
  const soundAllowed = data.settings.soundEnabled && isSirenSupported();
  const soundName = data.settings.alarmSound === 'silbato' ? ta.signals.whistle : ta.signals.siren;
  const reaction = metricValue(activeAlert, 'drillReaction');
  const medical = data.medical?.showOnAlert ? data.medical : null;

  return (
    <AppLayout title={ta.title} backTo="/inicio" hideNav>
      <section className={`alert-hero${flash ? ' alert-hero--flash' : ''}`} role="status" aria-live="assertive">
        <span className="alert-hero__pulse" aria-hidden="true"><Siren size={44} /></span>
        <h1>{ta.hero}</h1>
        <p>{eventTypeLabel[activeAlert.eventType]}</p>
        <div className="alert-hero__meta">
          <span>{ta.activated} <strong>{formatTime(activeAlert.activatedAt)}</strong></span>
          <span>{ta.duration} <strong>{formatDuration(activeAlert.activatedAt)}</strong></span>
        </div>
        {activeAlert.isDrill && (
          <div className="alert-hero__meta">
            <Timer size={14} aria-hidden="true" />
            <span>{ta.drillReaction} <strong>{reaction != null ? formatMs(reaction) : ta.beforeSignal}</strong></span>
          </div>
        )}
      </section>

      <HelpStatusBanner alertId={activeAlert.id} />

      {activeAlert.urgent ? (
        <div className="callout callout--row urgent-on" role="status">
          <Siren size={22} aria-hidden="true" />
          <div>
            <strong>{ta.urgent.on}</strong>
            <p className="small">{ta.urgent.onHint}</p>
            <button type="button" className="link-btn small" onClick={() => askUrgentHelp(false)}>{ta.urgent.cancel}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--urgent btn--lg btn--block" onClick={() => askUrgentHelp(true)}>
          <Siren size={22} aria-hidden="true" />
          <span className="btn-urgent__text"><strong>{ta.urgent.button}</strong><small>{ta.urgent.hint}</small></span>
        </button>
      )}

      <NetworkBanner />

      <a className="btn btn--danger btn--lg btn--block" href={`tel:${getEmergencyNumber()}`}>
        <Phone size={20} aria-hidden="true" /> {ta.call123}
      </a>

      <section className="card">
        <h2 className="card__title">{ta.channels.title}</h2>
        <div className="channel">
          <span className="channel__icon"><Radio size={20} aria-hidden="true" /></span>
          <div>
            <strong>{ta.channels.local}</strong>
            <p className="small muted">{ta.channels.localDetail}</p>
          </div>
          <LocalBadge />
        </div>
        <div className="channel">
          <span className="channel__icon"><MessageSquare size={20} aria-hidden="true" /></span>
          <div>
            <strong>{ta.channels.digital}</strong>
            <p className="small muted">{ta.delivery[activeAlert.digitalStatus]}</p>
          </div>
          <span className="badge-col">
            <StatusBadge tone={delivery.tone} label={delivery.label} />
            {activeAlert.simulatedDelivery && <DemoBadge label={ta.channels.simulation} />}
          </span>
        </div>
        <button className="btn btn--primary btn--block" onClick={sendSms} disabled={smsContacts.length === 0}>
          <Send size={18} aria-hidden="true" />
          {activeAlert.digitalStatus === 'sms_abierto' ? ta.channels.resendSms : ta.channels.sendSms(smsContacts.length)}
        </button>
        {smsContacts.length === 0 && (
          <p className="small muted">{ta.channels.noContacts}</p>
        )}
        {smsContacts.length > 0 && (
          <div className="whatsapp-list">
            <p className="small muted">{ta.channels.whatsappTitle}</p>
            {smsContacts.map((c) => (
              <button key={c.id} className="btn btn--whatsapp btn--block" onClick={() => void sendWhatsapp(c)}>
                <MessageCircle size={18} aria-hidden="true" /> {ta.channels.whatsappTo(c.name)}
              </button>
            ))}
          </div>
        )}
        <AlertEmailCard alert={activeAlert} />
        <p className="callout callout--warning small">
          <strong>{ta.channels.warningStrong}</strong> {ta.channels.warningText}
        </p>
      </section>

      <section className={`card trapped-card${trapped ? ' trapped-card--on' : ''}`}>
        <h2 className="card__title"><BatteryLow size={18} aria-hidden="true" /> {ta.trapped.title}</h2>
        {lowBattery != null && (
          <div className="callout callout--warning stack" role="alert">
            <p className="small"><strong>{ta.lowBattery.notice(lowBattery)}</strong></p>
            <div className="btn-pair">
              {trapped && (
                <button className="btn btn--outline" onClick={toggleTrapped}>{ta.lowBattery.resume}</button>
              )}
              {smsContacts.length > 0 && (
                <button className="btn btn--primary" onClick={notifyLowBattery}>{ta.lowBattery.notify}</button>
              )}
            </div>
          </div>
        )}
        <p className="small">
          {trapped
            ? ta.trapped.on(TRAPPED_INTERVAL_MS / 60_000, isNative())
            : ta.trapped.off}
        </p>
        <button className={`btn btn--block ${trapped ? 'btn--dark' : 'btn--outline'}`} onClick={toggleTrapped}>
          <BatteryLow size={18} aria-hidden="true" /> {trapped ? ta.trapped.exit : ta.trapped.enter}
        </button>
      </section>

      <section className="card">
        <h2 className="card__title">{ta.signals.title}</h2>
        {trapped && <p className="callout callout--info small">{ta.signals.pausedTrapped}</p>}
        <div className="signal-row">
          <button className={`btn ${playing ? 'btn--dark' : 'btn--outline'}`} onClick={toggleSound} disabled={!soundAllowed || trapped}>
            {playing ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            {playing ? ta.signals.mute(soundName) : ta.signals.unmute(soundName)}
          </button>
          <StatusBadge tone={playing ? 'danger' : 'neutral'} label={playing ? ta.signals.sounding : ta.signals.silent} icon={playing ? Volume2 : BellOff} />
        </div>
        {!soundAllowed && (
          <p className="small muted">{ta.signals.soundUnavailable}</p>
        )}
        <div className="signal-row">
          <button className={`btn ${vibrating ? 'btn--dark' : 'btn--outline'}`} onClick={toggleVibration} disabled={!isVibrationSupported() || trapped}>
            <Smartphone size={18} aria-hidden="true" />
            {vibrating ? ta.signals.stopVibration : ta.signals.vibration}
          </button>
          <StatusBadge tone={vibrating ? 'danger' : 'neutral'} label={vibrating ? ta.signals.vibrating : ta.signals.off} icon={Smartphone} />
        </div>
        <div className="toggle-row toggle-row--plain">
          <span><Eye size={18} aria-hidden="true" /> {ta.signals.visual}</span>
          <IonToggle
            checked={flash}
            disabled={data.settings.reduceMotion}
            onIonChange={(e) => {
              setFlash(e.detail.checked);
              // La linterna depende de la señal visual: al desactivarla también se apaga.
              if (!e.detail.checked) stopTorch();
            }}
            aria-label={ta.signals.visual}
          />
        </div>
        {data.settings.reduceMotion && <p className="small muted">{ta.signals.reduceMotion}</p>}
        <div className="signal-row">
          <button className={`btn ${torchOn ? 'btn--dark' : 'btn--outline'}`} onClick={toggleTorch} disabled={!flash || !isTorchApiAvailable() || trapped}>
            {torchOn ? <FlashlightOff size={18} aria-hidden="true" /> : <Flashlight size={18} aria-hidden="true" />}
            {torchOn ? ta.signals.torchOff : ta.signals.torch}
          </button>
          <StatusBadge tone={torchOn ? 'danger' : 'neutral'} label={torchOn ? ta.signals.flashing : ta.signals.off} icon={torchOn ? Flashlight : FlashlightOff} />
        </div>
        <p className="small muted">
          {!flash
            ? ta.signals.torchNeedsVisual
            : isTorchApiAvailable()
            ? ta.signals.torchHint
            : ta.signals.torchUnsupported}
        </p>
        <p className="small muted">
          {trapped ? ta.signals.screenTrapped : ta.signals.screenOn}
        </p>
      </section>

      <LocationStatusCard snapshot={activeAlert.location} permission={data.locationPermission} compact />
      {data.locationPermission !== 'denegado' && data.locationPermission !== 'no_disponible' && (
        <p className="small muted center">
          {ta.locationAuto(activeAlert.locationUpdates ?? 0)}
        </p>
      )}

      {medical && (
        <section className="card medical-card">
          <h2 className="card__title"><HeartPulse size={18} aria-hidden="true" /> {ta.medical.title}</h2>
          <dl className="medical-list">
            {medical.bloodType && <><dt>{ta.medical.bloodType}</dt><dd>{medical.bloodType}</dd></>}
            {medical.allergies && <><dt>{ta.medical.allergies}</dt><dd>{medical.allergies}</dd></>}
            {medical.medications && <><dt>{ta.medical.medications}</dt><dd>{medical.medications}</dd></>}
            {medical.conditions && <><dt>{ta.medical.conditions}</dt><dd>{medical.conditions}</dd></>}
            {medical.notes && <><dt>{ta.medical.notes}</dt><dd>{medical.notes}</dd></>}
          </dl>
          <MedicalQr userName={data.settings.userName} medical={medical} initiallyOpen />
          {isNative() && <p className="small muted">{tf.lockScreen.note}</p>}
        </section>
      )}

      {meeting.point && (
        <section className="card">
          <h2 className="card__title"><Navigation size={18} aria-hidden="true" /> {tf.compass.title}</h2>
          {meeting.chooser}
          <MeetingCompass meetingPoint={meeting.point} fallback={activeAlert.location} />
        </section>
      )}

      <button className="btn btn--outline btn--block" onClick={() => router.push(`/despues-del-sismo?alerta=${encodeURIComponent(activeAlert.id)}`, 'forward')}>
        <ClipboardList size={18} aria-hidden="true" /> {tf.postQuake.title}
      </button>

      {/* Fijo en la parte inferior de la pantalla aunque haya scroll: siempre a un toque. */}
      <div className="sticky-action">
        <button className="btn btn--success btn--lg btn--block" onClick={() => setConfirmEnd(true)}>
          <CheckCircle2 size={20} aria-hidden="true" /> {ta.safeFinish}
        </button>
      </div>

      <ConfirmationDialog
        isOpen={confirmEnd}
        title={ta.confirmEnd.title}
        message={ta.confirmEnd.message}
        confirmText={ta.confirmEnd.confirm}
        onConfirm={finish}
        onClose={() => setConfirmEnd(false)}
      />
    </AppLayout>
  );
}
