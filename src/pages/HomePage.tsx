// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { useIonRouter } from '@ionic/react';
import { BookOpen, History, MapPin, MessageSquare, Radio, Users, Volume2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { AlertStatusCard } from '../components/AlertStatusCard';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { PanicButton } from '../components/PanicButton';
import { ServiceIndicator } from '../components/ServiceIndicator';
import type { BadgeTone } from '../components/StatusBadge';
import { permissionBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { isSirenSupported, startSiren } from '../services/sirenService';
import { startTorchBlink } from '../services/torchService';
import type { EventType } from '../types';
import { formatLongDate } from '../utils/format';

export default function HomePage() {
  const router = useIonRouter();
  const { data, activeAlert, activateAlert } = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { settings, contacts, locationPermission, lastLocation } = data;

  const onPanic = () => (activeAlert ? router.push('/alerta', 'forward') : setConfirmOpen(true));

  const onConfirm = (value?: unknown) => {
    activateAlert((value as EventType) ?? 'sismo');
    router.push('/alerta', 'forward');
  };

  // Sirena y linterna arrancan dentro del toque de confirmación: los navegadores bloquean audio y cámara sin gesto del usuario.
  // La linterna solo se enciende sola en la app nativa (en escritorio encendería la cámara web sin tener flash).
  const onConfirmPress = () => {
    if (settings.soundEnabled) void startSiren();
    if (Capacitor.isNativePlatform() && settings.visualSignalEnabled && !settings.reduceMotion) void startTorchBlink();
  };

  const quick: { path: string; label: string; detail: string; icon: LucideIcon }[] = [
    { path: '/contactos', label: 'Contactos', detail: `${contacts.length} de confianza`, icon: Users },
    { path: '/ubicacion', label: 'Ubicación', detail: lastLocation ? (lastLocation.source === 'prueba' ? 'De prueba' : 'Registrada') : 'Sin registrar', icon: MapPin },
    { path: '/guia', label: 'Guía', detail: 'Antes, durante, después', icon: BookOpen },
    { path: '/historial', label: 'Historial', detail: `${data.alerts.length} registros`, icon: History },
  ];

  const sound: { tone: BadgeTone; status: string } = !isSirenSupported()
    ? { tone: 'neutral', status: 'No soportado' }
    : settings.soundEnabled ? { tone: 'success', status: 'Disponible' } : { tone: 'warning', status: 'Desactivado' };
  const perm = permissionBadge[locationPermission];

  return (
    <AppLayout title="Panel principal">
      <section className="greeting">
        <p className="muted capitalize">{formatLongDate()}</p>
        <h1>Hola, {settings.userName}</h1>
      </section>

      <AlertStatusCard alert={activeAlert} onOpen={() => router.push('/alerta', 'forward')} />

      <section className="panic-zone" aria-label="Botón de pánico">
        <PanicButton onPress={onPanic} active={!!activeAlert} />
        <p className="muted small center">
          {activeAlert ? 'Hay una alerta en curso.' : 'Se pedirá confirmación para evitar activaciones accidentales.'}
        </p>
      </section>

      <section>
        <h2 className="section-title">Accesos rápidos</h2>
        <div className="quick-grid">
          {quick.map(({ path, label, detail, icon: Icon }) => (
            <button key={path} className="card quick-tile" onClick={() => router.push(path, 'root', 'replace')}>
              <span className="quick-tile__icon"><Icon size={22} aria-hidden="true" /></span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Disponibilidad de servicios</h2>
        <ul className="service-list">
          <ServiceIndicator icon={Radio} name="Alerta local" detail="Funciona sin conexión en este dispositivo" tone="success" status="Disponible" />
          <ServiceIndicator icon={Volume2} name="Señal sonora" detail="Sirena generada en el dispositivo" {...sound} />
          <ServiceIndicator icon={MapPin} name="Ubicación" detail="Geolocalización del navegador o dispositivo" tone={perm.tone} status={perm.label} />
          <ServiceIndicator
            icon={MessageSquare}
            name="Canal digital"
            detail={settings.demoMode ? 'Entrega simulada; no se envían mensajes' : 'SMS a contactos desde la app de mensajes'}
            tone={settings.demoMode ? 'demo' : 'info'}
            status={settings.demoMode ? 'Simulado' : 'SMS'}
          />
        </ul>
      </section>

      <ConfirmationDialog
        isOpen={confirmOpen}
        title="¿Activar alerta?"
        message="Se activará una alerta local en este dispositivo. Seleccione el tipo de evento."
        confirmText="Activar alerta"
        destructive
        inputs={[
          { type: 'radio', label: 'Sismo', value: 'sismo', checked: true },
          { type: 'radio', label: 'Otra emergencia', value: 'emergencia_general' },
          { type: 'radio', label: 'Prueba del sistema', value: 'prueba' },
        ]}
        onConfirm={onConfirm}
        onConfirmPress={onConfirmPress}
        onClose={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
