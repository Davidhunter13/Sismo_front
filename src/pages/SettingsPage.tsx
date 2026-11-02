// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonLabel, IonSegment, IonSegmentButton, IonToggle, useIonRouter, useIonToast } from '@ionic/react';
import { Activity, AlertTriangle, Eye, FlaskConical, MapPin, RotateCcw, Trash2, User, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { StatusBadge } from '../components/StatusBadge';
import { permissionBadge } from '../components/statusMaps';
import { useAppState } from '../context/appContext';
import { FALL_COUNTDOWN_S, isMotionSupported } from '../services/fallDetectionService';
import type { AlarmSound, Settings } from '../types';

type ToggleKey = keyof Pick<Settings, 'soundEnabled' | 'visualSignalEnabled' | 'vibrationEnabled' | 'highContrast' | 'largeText' | 'reduceMotion'>;

const limitations = [
  'El SMS se abre en la app de mensajes: SISMO no puede confirmar si se envió ni si llegó.',
  'No contacta automáticamente a las autoridades; el botón «Llamar al 123» abre el marcador.',
  'El estado «Enviada» solo aparece como simulación del modo de demostración.',
  'No detecta ni predice sismos; la alerta la activa siempre la persona usuaria.',
  'Los datos se guardan únicamente en este dispositivo (LocalStorage).',
  'El mapa real y los sismos recientes requieren conexión a internet.',
];

export default function SettingsPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const { data, updateSettings, setDemoMode, resetDemoData, resetAll } = useAppState();
  const { settings } = data;
  const [name, setName] = useState(settings.userName);
  const [dialog, setDialog] = useState<'demo' | 'all' | null>(null);

  useEffect(() => setName(settings.userName), [settings.userName]);

  const nameError = name.trim().length < 2 ? 'Mínimo 2 caracteres.' : name.trim().length > 30 ? 'Máximo 30 caracteres.' : '';
  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2200, color, position: 'top' });

  const saveName = () => {
    if (nameError) return;
    updateSettings({ userName: name.trim() });
    toast('Nombre actualizado.');
  };

  const toggles: { key: ToggleKey; label: string; detail: string }[] = [
    { key: 'soundEnabled', label: 'Señal sonora', detail: 'Permite reproducir la sirena durante una alerta.' },
    { key: 'visualSignalEnabled', label: 'Señal visual intermitente', detail: 'Destello del indicador y linterna SOS.' },
    { key: 'vibrationEnabled', label: 'Vibración SOS', detail: 'Vibra en patrón SOS durante la alerta.' },
    { key: 'highContrast', label: 'Alto contraste', detail: 'Bordes y textos más marcados.' },
    { key: 'largeText', label: 'Texto grande', detail: 'Aumenta el tamaño de la letra.' },
    { key: 'reduceMotion', label: 'Reducir animaciones', detail: 'Desactiva pulsos y destellos.' },
  ];
  const perm = permissionBadge[data.locationPermission];

  return (
    <AppLayout title="Configuración" backTo="/inicio" showSettings={false}>
      <section className="card">
        <h2 className="card__title"><User size={18} aria-hidden="true" /> Perfil de demostración</h2>
        <IonInput
          className={nameError ? 'ion-invalid ion-touched' : ''}
          label="Nombre de usuario"
          labelPlacement="stacked"
          fill="outline"
          value={name}
          maxlength={30}
          errorText={nameError}
          onIonInput={(e) => setName(String(e.detail.value ?? ''))}
        />
        <button className="btn btn--primary btn--sm" onClick={saveName} disabled={!!nameError || name.trim() === settings.userName}>
          Guardar nombre
        </button>
      </section>

      <section className="card">
        <h2 className="card__title"><Volume2 size={18} aria-hidden="true" /> Sonido y accesibilidad <Eye size={18} aria-hidden="true" /></h2>
        {toggles.map(({ key, label, detail }) => (
          <div key={key} className="toggle-row toggle-row--plain">
            <span><strong>{label}</strong><small>{detail}</small></span>
            <IonToggle checked={settings[key]} onIonChange={(e) => updateSettings({ [key]: e.detail.checked })} aria-label={label} />
          </div>
        ))}
        <div className="stack">
          <span><strong>Sonido de la alarma</strong><small className="muted"> · El silbato (tres pitidos agudos) se oye mejor entre escombros.</small></span>
          <IonSegment value={settings.alarmSound} onIonChange={(e) => updateSettings({ alarmSound: e.detail.value as AlarmSound })} className="segment">
            <IonSegmentButton value="sirena"><IonLabel>Sirena</IonLabel></IonSegmentButton>
            <IonSegmentButton value="silbato"><IonLabel>Silbato</IonLabel></IonSegmentButton>
          </IonSegment>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title"><Activity size={18} aria-hidden="true" /> Detección de caídas</h2>
        <div className="toggle-row toggle-row--plain">
          <span>
            <strong>Preguntar «¿Está bien?» tras una caída</strong>
            <small>
              Con la app abierta, si el acelerómetro detecta una caída o un impacto fuerte, pregunta durante {FALL_COUNTDOWN_S} s y,
              si no responde, activa la alerta. Puede dar falsas alarmas (por ejemplo, si se le cae el teléfono).
            </small>
          </span>
          <IonToggle
            checked={settings.fallDetection}
            disabled={!isMotionSupported()}
            onIonChange={(e) => updateSettings({ fallDetection: e.detail.checked })}
            aria-label="Detección de caídas"
          />
        </div>
        {!isMotionSupported() && <p className="small muted">Este dispositivo o navegador no ofrece el acelerómetro.</p>}
      </section>

      <section className="card card--demo">
        <h2 className="card__title"><FlaskConical size={18} aria-hidden="true" /> Modo de demostración</h2>
        <div className="toggle-row toggle-row--plain">
          <span>
            <strong>{settings.demoMode ? 'Activado' : 'Desactivado'}</strong>
            <small>Carga contactos e historial ficticios y simula el canal digital. Al desactivarlo se retiran los datos de ejemplo.</small>
          </span>
          <IonToggle
            checked={settings.demoMode}
            onIonChange={(e) => {
              setDemoMode(e.detail.checked);
              toast(e.detail.checked ? 'Modo de demostración activado.' : 'Modo de demostración desactivado.', 'medium');
            }}
            aria-label="Modo de demostración"
          />
        </div>
        <button className="btn btn--outline btn--block" onClick={() => setDialog('demo')}>
          <RotateCcw size={18} aria-hidden="true" /> Restablecer datos de demostración
        </button>
      </section>

      <section className="card">
        <h2 className="card__title"><MapPin size={18} aria-hidden="true" /> Permisos</h2>
        <div className="channel">
          <div><strong>Ubicación</strong><p className="small muted">En la app Android se pide al abrirla; en el navegador, al pulsar «Solicitar mi ubicación». Puede revocarla desde el sistema.</p></div>
          <StatusBadge tone={perm.tone} label={perm.label} />
        </div>
        <div className="channel">
          <div><strong>Notificaciones (Android)</strong><p className="small muted">Muestran la alerta activa con la pantalla bloqueada y permiten silenciar la sirena.</p></div>
          <StatusBadge tone="info" label="Al abrir la app" />
        </div>
        <div className="channel">
          <div><strong>SMS y llamadas</strong><p className="small muted">No requieren permiso: SISMO abre la app de mensajes o el marcador y usted confirma.</p></div>
          <StatusBadge tone="neutral" label="Sin permiso" />
        </div>
      </section>

      <section className="card">
        <h2 className="card__title"><AlertTriangle size={18} aria-hidden="true" /> Limitaciones del prototipo</h2>
        <ul className="bullets">{limitations.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>

      <button className="btn btn--danger-outline btn--block" onClick={() => setDialog('all')}>
        <Trash2 size={18} aria-hidden="true" /> Borrar todos los datos
      </button>
      <p className="small muted center">SISMO v0.1.0 · Prototipo académico</p>

      <ConfirmationDialog
        isOpen={dialog === 'demo'}
        title="¿Restablecer demostración?"
        message="Se borrarán contactos, historial y ubicación, y se cargarán de nuevo los datos ficticios de ejemplo."
        confirmText="Restablecer"
        destructive
        onConfirm={() => {
          resetDemoData();
          toast('Datos de demostración restablecidos.');
        }}
        onClose={() => setDialog((d) => (d === 'demo' ? null : d))}
      />
      <ConfirmationDialog
        isOpen={dialog === 'all'}
        title="¿Borrar todos los datos?"
        message="Se eliminará toda la información guardada en este dispositivo y volverá a la pantalla de bienvenida."
        confirmText="Borrar todo"
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
