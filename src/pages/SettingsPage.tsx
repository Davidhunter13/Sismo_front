// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonLabel, IonSegment, IonSegmentButton, IonToggle, useIonRouter, useIonToast } from '@ionic/react';
import {
  Activity, AlertTriangle, BatteryLow, Eye, FlaskConical, Languages, MapPin, Palette, Play, RotateCcw, Square, Trash2, User, Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { StatusBadge } from '../components/StatusBadge';
import { permissionBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { setupGaps } from '../utils/setupGaps';
import { FALL_COUNTDOWN_S, isMotionSupported } from '../services/fallDetectionService';
import { isSirenSupported, previewSound, stopPreview } from '../services/sirenService';
import { LANGS, type Lang } from '../i18n';
import { useT } from '../i18n/useT';
import type { AlarmSound, Settings, ThemePref } from '../types';

type ToggleKey = keyof Pick<Settings, 'soundEnabled' | 'visualSignalEnabled' | 'vibrationEnabled' | 'highContrast' | 'largeText' | 'reduceMotion'>;

const TOGGLE_KEYS: ToggleKey[] = ['soundEnabled', 'visualSignalEnabled', 'vibrationEnabled', 'highContrast', 'largeText', 'reduceMotion'];

/** Umbrales del ahorro automático de batería (0 = nunca). 20 % es el aviso de batería baja de Android. */
const LOW_BATTERY_OPTIONS = [0, 10, 15, 20, 30];

export default function SettingsPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const { data, activeAlert, updateSettings, setDemoMode, resetDemoData, resetAll } = useAppState();
  const { settings } = data;
  const { common: tc, settings: t } = useT();
  const [name, setName] = useState(settings.userName);
  const [dialog, setDialog] = useState<'demo' | 'all' | null>(null);
  const [previewing, setPreviewing] = useState<AlarmSound | null>(null);

  useEffect(() => setName(settings.userName), [settings.userName]);
  // Al salir de Configuración se corta cualquier muestra en curso.
  useEffect(() => stopPreview, []);

  const soundOptions: { value: AlarmSound; label: string }[] = [
    { value: 'sirena', label: t.sound.siren },
    { value: 'silbato', label: t.sound.whistle },
  ];

  const togglePreview = async (sound: AlarmSound) => {
    if (previewing === sound) {
      stopPreview();
      setPreviewing(null);
      return;
    }
    setPreviewing(sound);
    const ok = await previewSound(sound, () => setPreviewing((p) => (p === sound ? null : p)));
    if (!ok) {
      setPreviewing(null);
      toast(t.sound.unsupported, 'warning');
    }
  };

  const nameError = name.trim().length < 2 ? t.profile.min : name.trim().length > 30 ? t.profile.max : '';
  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2200, color, position: 'top' });

  const saveName = () => {
    if (nameError) return;
    updateSettings({ userName: name.trim() });
    toast(t.profile.saved);
  };

  const toggles: { key: ToggleKey; label: string; detail: string }[] = TOGGLE_KEYS.map((key) => ({ key, ...t.toggles[key] }));
  const perm = permissionBadge[data.locationPermission];

  return (
    <AppLayout title={t.title} backTo="/inicio" showSettings={false}>
      {/* Borde rojo si falta el nombre (p. ej. se dio SOS durante el registro). */}
      <section className={`card${setupGaps(data).includes('name') ? ' card--missing' : ''}`}>
        <h2 className="card__title"><User size={18} aria-hidden="true" /> {t.profile.title}</h2>
        <IonInput
          className={nameError ? 'ion-invalid ion-touched' : ''}
          label={t.profile.nameLabel}
          labelPlacement="stacked"
          fill="outline"
          value={name}
          maxlength={30}
          errorText={nameError}
          onIonInput={(e) => setName(String(e.detail.value ?? ''))}
        />
        <button className="btn btn--primary btn--sm" onClick={saveName} disabled={!!nameError || name.trim() === settings.userName}>
          {t.profile.save}
        </button>
      </section>

      <section className="card stack">
        <h2 className="card__title"><Languages size={18} aria-hidden="true" /> {tc.language.title}</h2>
        <IonSegment value={settings.language} onIonChange={(e) => updateSettings({ language: e.detail.value as Lang })} className="segment" aria-label={tc.language.title}>
          {LANGS.map((l) => <IonSegmentButton key={l.value} value={l.value}><IonLabel>{l.label}</IonLabel></IonSegmentButton>)}
        </IonSegment>
        <p className="small muted">{tc.language.hint}</p>

        <h2 className="card__title"><Palette size={18} aria-hidden="true" /> {tc.theme.title}</h2>
        <IonSegment value={settings.theme} onIonChange={(e) => updateSettings({ theme: e.detail.value as ThemePref })} className="segment" aria-label={tc.theme.title}>
          <IonSegmentButton value="sistema"><IonLabel>{tc.theme.system}</IonLabel></IonSegmentButton>
          <IonSegmentButton value="claro"><IonLabel>{tc.theme.light}</IonLabel></IonSegmentButton>
          <IonSegmentButton value="oscuro"><IonLabel>{tc.theme.dark}</IonLabel></IonSegmentButton>
        </IonSegment>
        <p className="small muted">{tc.theme.hint}</p>
      </section>

      <section className="card">
        <h2 className="card__title"><Volume2 size={18} aria-hidden="true" /> {t.sound.title} <Eye size={18} aria-hidden="true" /></h2>
        {toggles.map(({ key, label, detail }) => (
          <div key={key} className="toggle-row toggle-row--plain">
            <span><strong>{label}</strong><small>{detail}</small></span>
            <IonToggle checked={settings[key]} onIonChange={(e) => updateSettings({ [key]: e.detail.checked })} aria-label={label} />
          </div>
        ))}
        <div className="stack">
          <span><strong>{t.sound.alarm}</strong><small className="muted">{t.sound.alarmHint}</small></span>
          <IonSegment value={settings.alarmSound} onIonChange={(e) => updateSettings({ alarmSound: e.detail.value as AlarmSound })} className="segment">
            <IonSegmentButton value="sirena"><IonLabel>{t.sound.siren}</IonLabel></IonSegmentButton>
            <IonSegmentButton value="silbato"><IonLabel>{t.sound.whistle}</IonLabel></IonSegmentButton>
          </IonSegment>
          <div className="btn-pair">
            {soundOptions.map(({ value, label }) => (
              <button
                key={value}
                className={`btn ${previewing === value ? 'btn--dark' : 'btn--ghost'}`}
                onClick={() => void togglePreview(value)}
                disabled={!!activeAlert || !isSirenSupported()}
                aria-label={previewing === value ? t.sound.stopAria(label) : t.sound.listenAria(label)}
              >
                {previewing === value ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {previewing === value ? t.sound.stop : t.sound.listen(label)}
              </button>
            ))}
          </div>
          <p className="small muted">
            {activeAlert ? t.sound.busy : t.sound.hint}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title"><Activity size={18} aria-hidden="true" /> {t.fall.title}</h2>
        <div className="toggle-row toggle-row--plain">
          <span>
            <strong>{t.fall.ask}</strong>
            <small>{t.fall.detail(FALL_COUNTDOWN_S)}</small>
          </span>
          <IonToggle
            checked={settings.fallDetection}
            disabled={!isMotionSupported()}
            onIonChange={(e) => updateSettings({ fallDetection: e.detail.checked })}
            aria-label={t.fall.title}
          />
        </div>
        {!isMotionSupported() && <p className="small muted">{t.fall.unsupported}</p>}
      </section>

      <section className="card stack">
        <h2 className="card__title"><BatteryLow size={18} aria-hidden="true" /> {t.battery.title}</h2>
        <strong className="small">{t.battery.label}</strong>
        <IonSegment
          value={String(settings.lowBatterySaver)}
          onIonChange={(e) => updateSettings({ lowBatterySaver: Number(e.detail.value) })}
          className="segment segment--compact"
          aria-label={t.battery.label}
        >
          {LOW_BATTERY_OPTIONS.map((v) => (
            <IonSegmentButton key={v} value={String(v)}>
              <IonLabel>{v === 0 ? t.battery.off : `${v} %`}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
        <p className="small muted">{t.battery.detail}</p>
      </section>

      <section className="card card--demo">
        <h2 className="card__title"><FlaskConical size={18} aria-hidden="true" /> {t.demo.title}</h2>
        <div className="toggle-row toggle-row--plain">
          <span>
            <strong>{settings.demoMode ? t.demo.on : t.demo.off}</strong>
            <small>{t.demo.detail}</small>
          </span>
          <IonToggle
            checked={settings.demoMode}
            onIonChange={(e) => {
              setDemoMode(e.detail.checked);
              toast(e.detail.checked ? t.demo.toastOn : t.demo.toastOff, 'medium');
            }}
            aria-label={t.demo.title}
          />
        </div>
        <button className="btn btn--outline btn--block" onClick={() => setDialog('demo')}>
          <RotateCcw size={18} aria-hidden="true" /> {t.demo.reset}
        </button>
      </section>

      <section className="card">
        <h2 className="card__title"><MapPin size={18} aria-hidden="true" /> {t.perms.title}</h2>
        <div className="channel">
          <div><strong>{t.perms.location}</strong><p className="small muted">{t.perms.locationHint}</p></div>
          <StatusBadge tone={perm.tone} label={perm.label} />
        </div>
        <div className="channel">
          <div><strong>{t.perms.notifications}</strong><p className="small muted">{t.perms.notificationsHint}</p></div>
          <StatusBadge tone="info" label={t.perms.onOpen} />
        </div>
        <div className="channel">
          <div><strong>{t.perms.smsCalls}</strong><p className="small muted">{t.perms.smsCallsHint}</p></div>
          <StatusBadge tone="neutral" label={t.perms.none} />
        </div>
      </section>

      <section className="card">
        <h2 className="card__title"><AlertTriangle size={18} aria-hidden="true" /> {t.limitationsTitle}</h2>
        <ul className="bullets">{t.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>

      <button className="btn btn--danger-outline btn--block" onClick={() => setDialog('all')}>
        <Trash2 size={18} aria-hidden="true" /> {t.deleteAll}
      </button>
      <p className="small muted center">{t.version}</p>

      <ConfirmationDialog
        isOpen={dialog === 'demo'}
        title={t.demo.confirmTitle}
        message={t.demo.confirmMessage}
        confirmText={t.demo.confirmAction}
        destructive
        onConfirm={() => {
          resetDemoData();
          toast(t.demo.resetDone);
        }}
        onClose={() => setDialog((d) => (d === 'demo' ? null : d))}
      />
      <ConfirmationDialog
        isOpen={dialog === 'all'}
        title={t.deleteAllTitle}
        message={t.deleteAllMessage}
        confirmText={t.deleteAllAction}
        destructive
        onConfirm={() => {
          resetAll();
          router.push('/bienvenida', 'root', 'replace');
        }}
        onClose={() => setDialog((d) => (d === 'all' ? null : d))}
      />
    </AppLayout>
  );
}
