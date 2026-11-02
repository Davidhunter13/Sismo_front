// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import {
  Activity, Backpack, BarChart3, BookOpen, CheckCircle2, HeartPulse, History, MapPin, MessageSquare, Radio, Timer, Users, Volume2, type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertStatusCard } from '../components/AlertStatusCard';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { PanicButton } from '../components/PanicButton';
import { ServiceIndicator } from '../components/ServiceIndicator';
import type { BadgeTone } from '../components/StatusBadge';
import { permissionBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { kitStatus } from '../services/kitService';
import { beginTrace, mark } from '../services/metricsService';
import { buildSafeMessage, openSmsComposer } from '../services/smsService';
import { startAlertSignals } from '../services/signalsService';
import { isSirenSupported } from '../services/sirenService';
import { onSosDialogRequest } from '../services/sosRequestService';
import type { AlertSource, EventType } from '../types';
import { formatLongDate } from '../utils/format';
import { goToRoot } from '../utils/navigation';

export default function HomePage() {
  const router = useIonRouter();
  const { data, activeAlert, activateAlert, drill, cancelDrill } = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const source = useRef<AlertSource>('app');
  const { settings, contacts, locationPermission, lastLocation } = data;

  const openSos = useCallback(
    (from: AlertSource) => {
      if (activeAlert) {
        router.push('/alerta', 'forward');
        return;
      }
      source.current = from;
      beginTrace();
      setConfirmOpen(true);
    },
    [activeAlert, router],
  );

  // Widget o acceso rápido de Android.
  useEffect(() => onSosDialogRequest(() => openSos('acceso_rapido')), [openSos]);

  const onConfirm = (value?: unknown) => {
    activateAlert((value as EventType) ?? 'sismo', source.current);
    router.push('/alerta', 'forward');
  };

  // Las señales arrancan dentro del toque de confirmación (gesto del usuario).
  const onConfirmPress = () => {
    mark('confirmedAt');
    startAlertSignals(settings);
  };

  // Los contactos de demostración son ficticios: no se les envía SMS.
  const smsContacts = contacts.filter((c) => !c.isSeed);
  const kit = kitStatus(data.kit);
  const kitAlerts = kit.expired.length + kit.expiringSoon.length;
  const kitWarn = data.kit !== null && (kitAlerts > 0 || kit.reviewDue);
  const kitDetail = !data.kit
    ? 'Prepárela'
    : kitAlerts > 0 ? `${kitAlerts} por revisar` : kit.reviewDue ? 'Toca revisarla' : `${kit.checked}/${kit.total} listos`;

  const quick: { path: string; label: string; detail: string; icon: LucideIcon; root?: boolean; warn?: boolean }[] = [
    { path: '/contactos', label: 'Contactos', detail: `${contacts.length} de confianza`, icon: Users, root: true },
    { path: '/ubicacion', label: 'Ubicación', detail: lastLocation ? (lastLocation.source === 'prueba' ? 'De prueba' : 'Registrada') : 'Sin registrar', icon: MapPin, root: true },
    { path: '/guia', label: 'Guía', detail: 'Antes, durante, después', icon: BookOpen, root: true },
    { path: '/historial', label: 'Historial', detail: `${data.alerts.length} registros`, icon: History, root: true },
    { path: '/sismos', label: 'Sismos recientes', detail: 'Últimas 24 horas', icon: Activity },
    { path: '/simulacro', label: 'Simulacro', detail: 'Practique con cronómetro', icon: Timer },
    { path: '/estadisticas', label: 'Estadísticas', detail: 'Tiempos y CSV', icon: BarChart3 },
    { path: '/ficha-medica', label: 'Ficha médica', detail: data.medical ? 'Registrada' : 'Opcional', icon: HeartPulse },
    { path: '/mochila', label: 'Mochila', detail: kitDetail, icon: Backpack, warn: kitWarn },
  ];

  const sendSafe = () => openSmsComposer(smsContacts, buildSafeMessage(settings.userName));

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

      {drill && (
        <section className={`drill-banner${drill.phase === 'senal' ? ' drill-banner--go' : ''}`} role="status" aria-live="assertive">
          <Timer size={22} aria-hidden="true" />
          <div>
            <strong>{drill.phase === 'senal' ? '¡SISMO! Active la alerta ahora' : 'Simulacro en curso: espere la señal…'}</strong>
            <small>{drill.phase === 'senal' ? 'Toque SOS y confirme lo más rápido posible.' : 'La señal aparecerá en unos segundos.'}</small>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={cancelDrill}>Cancelar</button>
        </section>
      )}

      <AlertStatusCard alert={activeAlert} onOpen={() => router.push('/alerta', 'forward')} />

      <section className="panic-zone" aria-label="Botón de pánico">
        <PanicButton onPress={() => openSos('app')} active={!!activeAlert} />
        <p className="muted small center">
          {activeAlert ? 'Hay una alerta en curso.' : 'Se pedirá confirmación para evitar activaciones accidentales.'}
        </p>
        {!activeAlert && (
          <button className="btn btn--success btn--block" onClick={sendSafe} disabled={smsContacts.length === 0}>
            <CheckCircle2 size={18} aria-hidden="true" /> Avisar que estoy bien
          </button>
        )}
      </section>

      <section>
        <h2 className="section-title">Accesos rápidos</h2>
        <div className="quick-grid">
          {quick.map(({ path, label, detail, icon: Icon, root, warn }) => (
            <button
              key={path}
              className={`card quick-tile${warn ? ' quick-tile--warn' : ''}`}
              onClick={() => (root ? goToRoot(router, path) : router.push(path, 'forward'))}
            >
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
