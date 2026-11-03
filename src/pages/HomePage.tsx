// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import {
  Activity, Backpack, BarChart3, BookOpen, CheckCircle2, ClipboardList, HeartPulse, History, MapPin, MessageSquare, Navigation, Radio, Timer,
  Users,
  Volume2, Wifi, WifiOff, type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertStatusCard } from '../components/AlertStatusCard';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { HeaderCompass, MiniCompass } from '../components/MiniCompass';
import { NetworkBanner } from '../components/NetworkBanner';
import { PanicButton } from '../components/PanicButton';
import { useNotifySafe } from '../components/useNotifySafe';
import { ServiceIndicator } from '../components/ServiceIndicator';
import type { BadgeTone } from '../components/StatusBadge';
import { permissionBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { drillReminder } from '../services/drillReminderService';
import { kitStatus } from '../services/kitService';
import { beginTrace, mark } from '../services/metricsService';
import { useOnline } from '../services/networkService';
import { startAlertSignals } from '../services/signalsService';
import { isSirenSupported } from '../services/sirenService';
import { onSosDialogRequest } from '../services/sosRequestService';
import type { AlertSource, EventType } from '../types';
import { eventTypeLabel, formatLongDate } from '../utils/format';
import { goToRoot } from '../utils/navigation';

export default function HomePage() {
  const router = useIonRouter();
  const all = useT();
  const t = all.home;
  const { data, activeAlert, activateAlert, drill, cancelDrill } = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Al hacer scroll y perder de vista la mini brújula, aparece una en el encabezado.
  const [compassVisible, setCompassVisible] = useState(true);
  const source = useRef<AlertSource>('app');
  const online = useOnline();
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
    ? t.tiles.kitPrepare
    : kitAlerts > 0 ? t.tiles.kitToReview(kitAlerts) : kit.reviewDue ? t.tiles.kitReviewDue : t.tiles.kitReady(kit.checked, kit.total);

  const reminder = drillReminder(data.alerts);
  const rt = all.features.drillReminder;
  const reminderText = reminder.nationalSoon
    ? rt.national
    : reminder.personalDue
      ? reminder.daysSinceLast === null ? rt.personalNever : rt.personalDue(reminder.daysSinceLast)
      : null;

  const quick: { path: string; label: string; detail: string; icon: LucideIcon; root?: boolean; warn?: boolean }[] = [
    { path: '/contactos', label: t.tiles.contacts, detail: t.tiles.contactsDetail(contacts.length), icon: Users, root: true },
    {
      path: '/ubicacion',
      label: t.tiles.location,
      detail: lastLocation ? (lastLocation.source === 'prueba' ? t.tiles.locationTest : t.tiles.locationSaved) : t.tiles.locationNone,
      icon: MapPin,
      root: true,
    },
    { path: '/guia', label: t.tiles.guide, detail: t.tiles.guideDetail, icon: BookOpen, root: true },
    { path: '/historial', label: t.tiles.history, detail: t.tiles.historyDetail(data.alerts.length), icon: History, root: true },
    { path: '/despues-del-sismo', label: all.features.postQuake.tile, detail: all.features.postQuake.tileDetail, icon: ClipboardList },
    {
      path: '/ubicacion?ver=brujula',
      label: all.features.compass.tile,
      detail: data.meetingPoint ? data.meetingPoint.label : all.features.compass.tileNoPoint,
      icon: Navigation,
    },
    { path: '/sismos', label: t.tiles.quakes, detail: t.tiles.quakesDetail, icon: Activity },
    { path: '/simulacro', label: t.tiles.drill, detail: t.tiles.drillDetail, icon: Timer },
    { path: '/estadisticas', label: t.tiles.stats, detail: t.tiles.statsDetail, icon: BarChart3 },
    { path: '/ficha-medica', label: t.tiles.medical, detail: data.medical ? t.tiles.medicalSaved : t.tiles.medicalOptional, icon: HeartPulse },
    { path: '/mochila', label: t.tiles.kit, detail: kitDetail, icon: Backpack, warn: kitWarn },
  ];

  // Elige el canal (SMS o WhatsApp por contacto) en lugar de depender del enlace SMS.
  const notifySafe = useNotifySafe();
  const sendSafe = () => notifySafe();

  const s = t.services;
  const sound: { tone: BadgeTone; status: string } = !isSirenSupported()
    ? { tone: 'neutral', status: s.notSupported }
    : settings.soundEnabled ? { tone: 'success', status: s.available } : { tone: 'warning', status: s.disabled };
  const perm = permissionBadge[locationPermission];
  const net = all.features.network;

  return (
    <AppLayout title={t.title} headerExtra={compassVisible ? null : <HeaderCompass />}>
      <section className="greeting">
        <p className="muted capitalize">{formatLongDate()}</p>
        <h1>{t.hello(settings.userName)}</h1>
      </section>

      <NetworkBanner />

      {drill && (
        <section className={`drill-banner${drill.phase === 'senal' ? ' drill-banner--go' : ''}`} role="status" aria-live="assertive">
          <Timer size={22} aria-hidden="true" />
          <div>
            <strong>{drill.phase === 'senal' ? t.drill.go : t.drill.waiting}</strong>
            <small>{drill.phase === 'senal' ? t.drill.goHint : t.drill.waitingHint}</small>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={cancelDrill}>{t.drill.cancel}</button>
        </section>
      )}

      <AlertStatusCard alert={activeAlert} onOpen={() => router.push('/alerta', 'forward')} />

      <section className="panic-zone" aria-label={t.panicZone}>
        <PanicButton onPress={() => openSos('app')} active={!!activeAlert} />
        <p className="muted small center">{activeAlert ? t.activeNote : t.confirmNote}</p>
        {!activeAlert && (
          <button className="btn btn--success btn--block" onClick={sendSafe} disabled={smsContacts.length === 0}>
            <CheckCircle2 size={18} aria-hidden="true" /> {t.imSafe}
          </button>
        )}
        {/* Explica el bloqueo: los contactos de demostración son ficticios y no reciben mensajes. */}
        {!activeAlert && smsContacts.length === 0 && (
          <p className="small muted center" role="note">
            {contacts.length > 0 ? t.imSafeDemoOnly : t.imSafeNoContacts}{' '}
            <button className="link-btn" onClick={() => goToRoot(router, '/contactos')}>{t.addContactLink}</button>
          </p>
        )}
      </section>

      <MiniCompass onVisibleChange={setCompassVisible} />

      {!activeAlert && !drill && reminderText && (
        <section className="drill-reminder" role="note">
          <Timer size={20} aria-hidden="true" />
          <p className="small">{reminderText}</p>
          <button className="btn btn--ghost btn--sm" onClick={() => router.push('/simulacro', 'forward')}>{rt.action}</button>
        </section>
      )}

      <section>
        <h2 className="section-title">{t.quickTitle}</h2>
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
        <h2 className="card__title">{s.title}</h2>
        <ul className="service-list">
          <ServiceIndicator icon={Radio} name={s.localAlert} detail={s.localAlertDetail} tone="success" status={s.available} />
          <ServiceIndicator icon={Volume2} name={s.sound} detail={s.soundDetail} {...sound} />
          <ServiceIndicator icon={MapPin} name={s.location} detail={s.locationDetail} tone={perm.tone} status={perm.label} />
          <ServiceIndicator
            icon={MessageSquare}
            name={s.digital}
            detail={settings.demoMode ? s.digitalDemo : s.digitalSms}
            tone={settings.demoMode ? 'demo' : 'info'}
            status={settings.demoMode ? s.simulated : s.sms}
          />
          <ServiceIndicator
            icon={online ? Wifi : WifiOff}
            name={net.serviceName}
            detail={online ? net.serviceOnline : net.serviceOffline}
            tone={online ? 'success' : 'warning'}
            status={online ? net.online : net.offline}
          />
        </ul>
      </section>

      <ConfirmationDialog
        isOpen={confirmOpen}
        title={t.confirm.title}
        message={t.confirm.message}
        confirmText={t.confirm.action}
        cancelText={all.common.cancel}
        destructive
        inputs={[
          { type: 'radio', label: eventTypeLabel.sismo, value: 'sismo', checked: true },
          { type: 'radio', label: eventTypeLabel.emergencia_general, value: 'emergencia_general' },
          { type: 'radio', label: eventTypeLabel.prueba, value: 'prueba' },
        ]}
        onConfirm={onConfirm}
        onConfirmPress={onConfirmPress}
        onClose={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
