// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonToggle, useIonAlert, useIonRouter, useIonToast } from '@ionic/react';
import {
  BellOff, CheckCircle2, Eye, Flashlight, FlashlightOff, HeartPulse, MessageSquare, Phone, Radio, Send, ShieldCheck, Siren, Smartphone,
  Timer, Volume2, VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { DemoBadge, LocalBadge, StatusBadge } from '../components/StatusBadge';
import { deliveryBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { formatMs, metricValue } from '../services/metricsService';
import { refreshNativeSignals } from '../services/signalsService';
import { isSirenPlaying, isSirenSupported, startSiren, stopSiren } from '../services/sirenService';
import { buildAlertMessage, buildSafeMessage, openSmsComposer } from '../services/smsService';
import { isTorchApiAvailable, isTorchOn, startTorchBlink, stopTorch } from '../services/torchService';
import { isVibrating, isVibrationSupported, startVibration, stopVibration } from '../services/vibrationService';
import { eventTypeLabel, formatDuration, formatTime } from '../utils/format';

const deliveryText = {
  pendiente: 'Simulando el envío a sus contactos…',
  enviada: 'Entrega SIMULADA a los contactos ficticios. Ningún mensaje real fue enviado.',
  fallida: 'Fallo SIMULADO: no hay contactos configurados para recibir la alerta.',
  no_disponible: 'Toque «Enviar SMS» para avisar a sus contactos. Hasta entonces nadie ha sido notificado.',
  sms_abierto: 'Se abrió la app de mensajes con el aviso listo. SISMO no puede confirmar si lo envió: verifíquelo allí.',
} as const;

export default function AlertPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const { data, activeAlert, endAlert, markSmsOpened } = useAppState();
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

  // Reloj para la duración; también refresca el estado real de las señales (en Android se pueden
  // apagar desde la notificación).
  useEffect(() => {
    const t = window.setInterval(() => {
      void refreshNativeSignals().then(() => tick((n) => n + 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const sendSms = () => {
    if (!activeAlert) return;
    markSmsOpened();
    openSmsComposer(smsContacts, buildAlertMessage(data.settings.userName, activeAlert.eventType, activeAlert.location, data.meetingPoint, data.medical));
  };

  const toggleSound = async () => {
    if (playing) stopSiren();
    else await startSiren();
    tick((n) => n + 1);
  };

  const toggleVibration = async () => {
    if (vibrating) stopVibration();
    else if (!(await startVibration())) {
      presentToast({ message: 'Este dispositivo o navegador no permite vibrar.', duration: 3000, color: 'warning', position: 'top' });
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
          ? 'Sin permiso de cámara no se puede usar la linterna.'
          : 'Este dispositivo o navegador no permite controlar la linterna.';
        presentToast({ message, duration: 3000, color: 'warning', position: 'top' });
      }
    }
    tick((n) => n + 1);
  };

  const goHome = () => {
    // Inicio ya está debajo en la pila: volver evita que la vista de alerta quede superpuesta.
    if (router.canGoBack()) router.goBack();
    else router.push('/inicio', 'root', 'replace');
  };

  const finish = () => {
    if (!activeAlert) return;
    const { eventType } = activeAlert;
    setFlash(false);
    endAlert();
    presentToast({ message: 'Alerta finalizada y guardada en el historial.', duration: 2500, color: 'success', position: 'top' });
    if (smsContacts.length === 0) {
      goHome();
      return;
    }
    // Cierre del ciclo de comunicación: ofrecer el SMS «Estoy bien».
    let sendSafe = false;
    void presentAlert({
      header: '¿Avisar que está bien?',
      message: `Se abrirá la app de mensajes con un aviso para sus ${smsContacts.length} contacto(s).`,
      cssClass: 'sismo-alert',
      buttons: [
        { text: 'No, gracias', role: 'cancel', cssClass: 'sismo-alert__cancel' },
        { text: 'Enviar «Estoy bien»', cssClass: 'sismo-alert__confirm', handler: () => { sendSafe = true; } },
      ],
      onDidDismiss: () => {
        goHome();
        if (sendSafe) openSmsComposer(smsContacts, buildSafeMessage(data.settings.userName, eventType));
      },
    });
  };

  if (!activeAlert) {
    return (
      <AppLayout title="Alerta" backTo="/inicio">
        <section className="card empty-state">
          <ShieldCheck size={44} aria-hidden="true" />
          <h2>No hay una alerta activa</h2>
          <p className="muted">Puede activar una desde el botón SOS del panel principal.</p>
          <button className="btn btn--primary" onClick={() => router.push('/inicio', 'root', 'replace')}>Ir al inicio</button>
        </section>
      </AppLayout>
    );
  }

  const delivery = deliveryBadge[activeAlert.digitalStatus];
  const soundAllowed = data.settings.soundEnabled && isSirenSupported();
  const reaction = metricValue(activeAlert, 'drillReaction');
  const medical = data.medical?.showOnAlert ? data.medical : null;

  return (
    <AppLayout title="Alerta activa" backTo="/inicio" hideNav>
      <section className={`alert-hero${flash ? ' alert-hero--flash' : ''}`} role="status" aria-live="assertive">
        <span className="alert-hero__pulse" aria-hidden="true"><Siren size={44} /></span>
        <h1>ALERTA ACTIVA</h1>
        <p>{eventTypeLabel[activeAlert.eventType]}</p>
        <div className="alert-hero__meta">
          <span>Activada: <strong>{formatTime(activeAlert.activatedAt)}</strong></span>
          <span>Duración: <strong>{formatDuration(activeAlert.activatedAt)}</strong></span>
        </div>
        {activeAlert.isDrill && (
          <div className="alert-hero__meta">
            <Timer size={14} aria-hidden="true" />
            <span>Simulacro · reacción: <strong>{reaction != null ? formatMs(reaction) : 'antes de la señal'}</strong></span>
          </div>
        )}
      </section>

      <a className="btn btn--danger btn--lg btn--block" href="tel:123">
        <Phone size={20} aria-hidden="true" /> Llamar al 123
      </a>

      <section className="card">
        <h2 className="card__title">Estado por canal</h2>
        <div className="channel">
          <span className="channel__icon"><Radio size={20} aria-hidden="true" /></span>
          <div>
            <strong>Alerta local</strong>
            <p className="small muted">Activa en este dispositivo: indicador visual, sirena, linterna y vibración (puede apagarlas).</p>
          </div>
          <LocalBadge />
        </div>
        <div className="channel">
          <span className="channel__icon"><MessageSquare size={20} aria-hidden="true" /></span>
          <div>
            <strong>Canal digital (mensaje a contactos)</strong>
            <p className="small muted">{deliveryText[activeAlert.digitalStatus]}</p>
          </div>
          <span className="badge-col">
            <StatusBadge tone={delivery.tone} label={delivery.label} />
            {activeAlert.simulatedDelivery && <DemoBadge label="Simulación" />}
          </span>
        </div>
        <button className="btn btn--primary btn--block" onClick={sendSms} disabled={smsContacts.length === 0}>
          <Send size={18} aria-hidden="true" />
          {activeAlert.digitalStatus === 'sms_abierto' ? 'Abrir SMS de nuevo' : `Enviar SMS a mis contactos (${smsContacts.length})`}
        </button>
        {smsContacts.length === 0 && (
          <p className="small muted">Agregue contactos reales en la sección Contactos para poder enviarles el SMS.</p>
        )}
        <p className="callout callout--warning small">
          <strong>Activada localmente ≠ mensaje entregado.</strong> Solo un canal con estado «Enviada» real confirmaría que un
          destinatario recibió el aviso. Este prototipo no contacta servicios de emergencia.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">Señales locales</h2>
        <div className="signal-row">
          <button className={`btn ${playing ? 'btn--dark' : 'btn--outline'}`} onClick={toggleSound} disabled={!soundAllowed}>
            {playing ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            {playing ? 'Silenciar sirena' : 'Reactivar sirena'}
          </button>
          <StatusBadge tone={playing ? 'danger' : 'neutral'} label={playing ? 'Sonando' : 'En silencio'} icon={playing ? Volume2 : BellOff} />
        </div>
        {!soundAllowed && (
          <p className="small muted">El sonido está desactivado en Configuración o el navegador no lo soporta.</p>
        )}
        <div className="signal-row">
          <button className={`btn ${vibrating ? 'btn--dark' : 'btn--outline'}`} onClick={toggleVibration} disabled={!isVibrationSupported()}>
            <Smartphone size={18} aria-hidden="true" />
            {vibrating ? 'Detener vibración' : 'Vibración SOS'}
          </button>
          <StatusBadge tone={vibrating ? 'danger' : 'neutral'} label={vibrating ? 'Vibrando' : 'Apagada'} icon={Smartphone} />
        </div>
        <div className="toggle-row toggle-row--plain">
          <span><Eye size={18} aria-hidden="true" /> Señal visual intermitente</span>
          <IonToggle
            checked={flash}
            disabled={data.settings.reduceMotion}
            onIonChange={(e) => {
              setFlash(e.detail.checked);
              // La linterna depende de la señal visual: al desactivarla también se apaga.
              if (!e.detail.checked) stopTorch();
            }}
            aria-label="Señal visual intermitente"
          />
        </div>
        {data.settings.reduceMotion && <p className="small muted">Desactivada por la opción «Reducir animaciones».</p>}
        <div className="signal-row">
          <button className={`btn ${torchOn ? 'btn--dark' : 'btn--outline'}`} onClick={toggleTorch} disabled={!flash || !isTorchApiAvailable()}>
            {torchOn ? <FlashlightOff size={18} aria-hidden="true" /> : <Flashlight size={18} aria-hidden="true" />}
            {torchOn ? 'Apagar linterna' : 'Linterna SOS'}
          </button>
          <StatusBadge tone={torchOn ? 'danger' : 'neutral'} label={torchOn ? 'Destellando' : 'Apagada'} icon={torchOn ? Flashlight : FlashlightOff} />
        </div>
        <p className="small muted">
          {!flash
            ? 'Active la señal visual intermitente para usar la linterna.'
            : isTorchApiAvailable()
            ? 'Destella en código SOS (··· ––– ···). Solo usa el flash; no se toman ni envían imágenes.'
            : 'La linterna requiere un navegador compatible (p. ej. Chrome en Android) y conexión segura (HTTPS).'}
        </p>
        <p className="small muted">La pantalla permanece encendida mientras la alerta está activa.</p>
      </section>

      <LocationStatusCard snapshot={activeAlert.location} permission={data.locationPermission} compact />
      {data.locationPermission === 'concedido' && (
        <p className="small muted center">
          La ubicación se actualiza cada 2 minutos durante la alerta
          {activeAlert.locationUpdates ? ` · ${activeAlert.locationUpdates} actualización(es)` : ''}.
        </p>
      )}

      {medical && (
        <section className="card medical-card">
          <h2 className="card__title"><HeartPulse size={18} aria-hidden="true" /> Información médica</h2>
          <dl className="medical-list">
            {medical.bloodType && <><dt>Tipo de sangre</dt><dd>{medical.bloodType}</dd></>}
            {medical.allergies && <><dt>Alergias</dt><dd>{medical.allergies}</dd></>}
            {medical.medications && <><dt>Medicamentos</dt><dd>{medical.medications}</dd></>}
            {medical.conditions && <><dt>Condiciones</dt><dd>{medical.conditions}</dd></>}
            {medical.notes && <><dt>Notas</dt><dd>{medical.notes}</dd></>}
          </dl>
        </section>
      )}

      <button className="btn btn--success btn--lg btn--block" onClick={() => setConfirmEnd(true)}>
        <CheckCircle2 size={20} aria-hidden="true" /> Estoy a salvo · Finalizar alerta
      </button>

      <ConfirmationDialog
        isOpen={confirmEnd}
        title="¿Finalizar la alerta?"
        message="La alerta se cerrará y quedará registrada en el historial."
        confirmText="Finalizar"
        onConfirm={finish}
        onClose={() => setConfirmEnd(false)}
      />
    </AppLayout>
  );
}
