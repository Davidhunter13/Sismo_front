// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonToggle, useIonRouter, useIonToast } from '@ionic/react';
import { BellOff, CheckCircle2, Eye, Flashlight, FlashlightOff, MessageSquare, Radio, Send, ShieldCheck, Siren, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { DemoBadge, LocalBadge, StatusBadge } from '../components/StatusBadge';
import { deliveryBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { isSirenPlaying, isSirenSupported, startSiren, stopSiren } from '../services/sirenService';
import { buildAlertMessage, openSmsComposer } from '../services/smsService';
import { isTorchApiAvailable, isTorchOn, startTorchBlink, stopTorch } from '../services/torchService';
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
  const { data, activeAlert, endAlert, markSmsOpened } = useAppState();
  // Los contactos de demostración son ficticios: no se les envía SMS.
  const smsContacts = data.contacts.filter((c) => !c.isSeed);
  const [flash, setFlash] = useState(data.settings.visualSignalEnabled && !data.settings.reduceMotion);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [, tick] = useState(0);
  // La sirena se inicia al confirmar el SOS y sigue sonando aunque se salga de esta vista,
  // hasta que el usuario la silencie o finalice la alerta.
  const playing = isSirenPlaying();
  const torchOn = isTorchOn();

  // Reloj para la duración; también refresca el estado de la sirena.
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const sendSms = () => {
    if (!activeAlert) return;
    markSmsOpened();
    openSmsComposer(smsContacts, buildAlertMessage(data.settings.userName, activeAlert.eventType, activeAlert.location));
  };

  const toggleSound = async () => {
    if (playing) stopSiren();
    else await startSiren();
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

  const finish = () => {
    stopSiren();
    stopTorch();
    setFlash(false);
    endAlert();
    presentToast({ message: 'Alerta finalizada y guardada en el historial.', duration: 2500, color: 'success', position: 'top' });
    // Inicio ya está debajo en la pila: volver evita que la vista de alerta quede superpuesta.
    if (router.canGoBack()) router.goBack();
    else router.push('/inicio', 'root', 'replace');
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
      </section>

      <section className="card">
        <h2 className="card__title">Estado por canal</h2>
        <div className="channel">
          <span className="channel__icon"><Radio size={20} aria-hidden="true" /></span>
          <div>
            <strong>Alerta local</strong>
            <p className="small muted">Activa en este dispositivo: indicador visual y sirena (puede silenciarla).</p>
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
            {torchOn ? 'Apagar linterna' : 'Linterna intermitente'}
          </button>
          <StatusBadge tone={torchOn ? 'danger' : 'neutral'} label={torchOn ? 'Destellando' : 'Apagada'} icon={torchOn ? Flashlight : FlashlightOff} />
        </div>
        <p className="small muted">
          {!flash
            ? 'Active la señal visual intermitente para usar la linterna.'
            : isTorchApiAvailable()
            ? 'Pide permiso de cámara solo para encender el flash; no se toman ni envían imágenes.'
            : 'La linterna requiere un navegador compatible (p. ej. Chrome en Android) y conexión segura (HTTPS).'}
        </p>
      </section>

      <LocationStatusCard snapshot={activeAlert.location} permission={data.locationPermission} compact />

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
