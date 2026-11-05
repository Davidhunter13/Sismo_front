// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import {
  Activity, AlertTriangle, Backpack, BarChart3, BookOpen, CheckCircle2, ClipboardList, HeartPulse, History, Mail, MapPin, MessageSquare, Navigation, Radio, Timer,
  Users,
  Volume2, Wifi, WifiOff, type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertStatusCard } from '../components/AlertStatusCard';
import { AppLayout } from '../components/AppLayout';
import { Avatar } from '../components/Avatar';
import { MyBadgesCard } from '../components/MyBadgesCard';
import { ProfileCompletionCard } from '../components/ProfileCompletionCard';
import { recordAction } from '../services/badgeService';
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
import { useCatalogs } from '../services/catalogService';
import { drillReminder } from '../services/drillReminderService';
import { emailRecipients } from '../services/emailService';
import { kitStatus } from '../services/kitService';
import { syncEnabled } from '../services/syncService';
import { beginTrace, mark } from '../services/metricsService';
import { useOnline } from '../services/networkService';
import { adoptNativeAlertSignals, startAlertSignals } from '../services/signalsService';
import { isSirenSupported } from '../services/sirenService';
import { onSosDialogRequest } from '../services/sosRequestService';
import type { AlertSource, EventType } from '../types';
import { eventTypeLabel, formatLongDate } from '../utils/format';
import { goToRoot } from '../utils/navigation';
import { homeAttention, type Attention } from '../utils/homeAttention';
import { setupGaps } from '../utils/setupGaps';

export default function HomePage() {
  const router = useIonRouter();
  const all = useT();
  const t = all.home;
  const { data, activeAlert, activateAlert, drill, cancelDrill } = useAppState();
  // Tipos de evento del catálogo administrable (el primero queda seleccionado).
  const catalogs = useCatalogs();
  const eventTypes = catalogs.eventTypes;
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

  // Doble toque del widget: ya es la confirmación, así que la alerta se activa sin diálogo (tipo «Sismo»).
  // Las señales ya las encendió Android; aquí solo se ajustan a la Configuración.
  const activateFromWidget = useCallback(() => {
    if (!activeAlert) {
      beginTrace();
      mark('confirmedAt');
      activateAlert('sismo', 'widget');
      void adoptNativeAlertSignals(settings);
    }
    router.push('/alerta', 'forward');
  }, [activeAlert, activateAlert, router, settings]);

  // Widget (doble toque) o acceso rápido de Android (abre el diálogo).
  useEffect(
    () => onSosDialogRequest((immediate) => (immediate ? activateFromWidget() : openSos('acceso_rapido'))),
    [openSos, activateFromWidget],
  );

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
  // Qué le falta para estar preparada: amarillo = pendiente, rojo = algo de la mochila vencido o por vencer.
  const att = homeAttention(data, catalogs.postQuakeSteps.length);
  const names = (items: { name: string }[]) => items.slice(0, 3).map((i) => i.name).join(', ') + (items.length > 3 ? ` +${items.length - 3}` : '');
  const kitDetail = att.kit.expired.length || att.kit.expiring.length
    ? [att.kit.expired.length ? t.tiles.kitExpired(names(att.kit.expired)) : '', att.kit.expiring.length ? t.tiles.kitExpiring(names(att.kit.expiring)) : ''].filter(Boolean).join(' · ')
    : att.kit.empty ? t.tiles.kitEmpty
    : kit.reviewDue ? t.tiles.kitReviewDue : t.tiles.kitReady(kit.checked, kit.total);
  const pq = att.postQuake;

  const reminder = drillReminder(data.alerts);
  const rt = all.features.drillReminder;
  const reminderText = reminder.nationalSoon
    ? rt.national
    : reminder.personalDue
      ? reminder.daysSinceLast === null ? rt.personalNever : rt.personalDue(reminder.daysSinceLast)
      : null;

  // Tarjetas con borde rojo cuando falta un dato necesario (ver setupGaps).
  const gaps = setupGaps(data);
  const quick: { path: string; label: string; detail: string; icon: LucideIcon; root?: boolean; warn?: boolean; missing?: boolean; attention?: Attention }[] = [
    { path: '/contactos', label: t.tiles.contacts, detail: t.tiles.contactsDetail(contacts.length), icon: Users, root: true, missing: gaps.includes('contact') },
    {
      path: '/ubicacion',
      label: t.tiles.location,
      detail: lastLocation ? (lastLocation.source === 'prueba' ? t.tiles.locationTest : t.tiles.locationSaved) : t.tiles.locationNone,
      icon: MapPin,
      root: true,
      missing: gaps.includes('location'),
    },
    { path: '/guia', label: t.tiles.guide, detail: t.tiles.guideDetail, icon: BookOpen, root: true },
    { path: '/historial', label: t.tiles.history, detail: t.tiles.historyDetail(data.alerts.length), icon: History, root: true },
    {
      path: pq.alert ? `/despues-del-sismo?alerta=${encodeURIComponent(pq.alert.id)}` : '/despues-del-sismo',
      label: all.features.postQuake.tile,
      detail: pq.alert ? t.tiles.postQuakePending(new Date(pq.alert.endedAt ?? pq.alert.activatedAt).toLocaleDateString(), pq.done, pq.total) : all.features.postQuake.tileDetail,
      icon: ClipboardList,
      attention: pq.level,
    },
    {
      path: '/ubicacion?ver=brujula',
      label: all.features.compass.tile,
      detail: data.meetingPoints.length ? data.meetingPoints.map((p) => p.label).join(' · ') : t.tiles.compassNoPoint,
      icon: Navigation,
      attention: att.compass,
    },
    { path: '/sismos', label: t.tiles.quakes, detail: t.tiles.quakesDetail, icon: Activity },
    { path: '/simulacro', label: t.tiles.drill, detail: att.drill ? t.tiles.drillNever : t.tiles.drillDetail, icon: Timer, attention: att.drill },
    { path: '/estadisticas', label: t.tiles.stats, detail: t.tiles.statsDetail, icon: BarChart3 },
    { path: '/ficha-medica', label: t.tiles.medical, detail: data.medical ? t.tiles.medicalSaved : t.tiles.medicalMissing, icon: HeartPulse, attention: att.medical },
    { path: '/mochila', label: t.tiles.kit, detail: kitDetail, icon: Backpack, attention: att.kit.level },
  ];

  // Elige el canal (SMS o WhatsApp por contacto) en lugar de depender del enlace SMS.
  const notifySafe = useNotifySafe();
  const sendSafe = () => {
    recordAction('avisar_bien');
    notifySafe();
  };

  const s = t.services;
  const sound: { tone: BadgeTone; status: string } = !isSirenSupported()
    ? { tone: 'neutral', status: s.notSupported }
    : settings.soundEnabled ? { tone: 'success', status: s.available } : { tone: 'warning', status: s.disabled };
  const perm = permissionBadge[locationPermission];
  // Correo a contactos: lo envía el servidor; requiere API configurada, internet y algún contacto real con correo.
  const emailService: { tone: BadgeTone; status: string } = !syncEnabled()
    ? { tone: 'neutral', status: s.emailNoServer }
    : emailRecipients(contacts).length === 0
      ? { tone: 'warning', status: s.emailNoContacts }
      : online ? { tone: 'success', status: s.emailReady } : { tone: 'warning', status: s.emailOffline };
  const net = all.features.network;

  return (
    <AppLayout title={t.title} headerExtra={compassVisible ? null : <HeaderCompass />}>
      <section className="greeting greeting--avatar">
        <div>
          <p className="muted capitalize">{formatLongDate()}</p>
          <h1>{t.hello(settings.userName)}</h1>
        </div>
        <button className="greeting__avatar" onClick={() => router.push('/configuracion', 'forward')} aria-label={all.badges.photo.title}>
          <Avatar name={settings.userName} size="md" />
        </button>
      </section>

      <NetworkBanner />

      {/* Datos necesarios que faltan (p. ej. se dio SOS durante el registro): aviso rojo y acceso al registro. */}
      {gaps.length > 0 && !activeAlert && (
        <section className="card card--missing stack" role="alert">
          <h2 className="card__title"><AlertTriangle size={18} aria-hidden="true" /> {t.missing.title}</h2>
          <p className="small">{t.missing.list(gaps.map((g) => t.missing.items[g]))}</p>
          <button className="btn btn--danger btn--block" onClick={() => router.push('/registro', 'forward')}>
            {t.missing.cta}
          </button>
        </section>
      )}

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

      {/* Preparación: perfil completado (local, al instante) e insignias. Se ocultan durante una alerta. */}
      {!activeAlert && (
        <>
          <ProfileCompletionCard />
          <MyBadgesCard />
        </>
      )}

      <section>
        <h2 className="section-title">{t.quickTitle}</h2>
        <div className="quick-grid">
          {quick.map(({ path, label, detail, icon: Icon, root, warn, missing, attention }) => (
            <button
              key={path}
              className={`card quick-tile${missing || attention === 'urgente' ? ' quick-tile--missing' : warn || attention === 'pendiente' ? ' quick-tile--warn' : ''}`}
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
            icon={Mail}
            name={s.email}
            detail={s.emailDetail}
            {...emailService}
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
        inputs={eventTypes.map((e, i) => ({ type: 'radio' as const, label: eventTypeLabel[e.id], value: e.id, checked: i === 0 }))}
        onConfirm={onConfirm}
        onConfirmPress={onConfirmPress}
        onClose={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
