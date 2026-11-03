// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Lang } from '../i18n';

/** Ciclo de vida local de una alerta (solo en este dispositivo). */
export type AlertLifecycle = 'activa' | 'finalizada';

/**
 * Estado del canal digital (mensaje a contactos).
 * 'sms_abierto': se abrió la app de SMS con el mensaje listo; el envío lo confirma el usuario allí
 * y SISMO no puede verificarlo. 'enviada' y 'fallida' solo existen como simulación del modo de
 * demostración o como datos de ejemplo.
 */
export type DeliveryStatus = 'pendiente' | 'enviada' | 'fallida' | 'no_disponible' | 'sms_abierto';

export type EventType = 'sismo' | 'emergencia_general' | 'prueba';

export type LocationPermission = 'concedido' | 'denegado' | 'no_disponible' | 'sin_solicitar';

/** 'dispositivo' = obtenida del GPS/navegador; 'prueba' = coordenadas fijas de demostración. */
export type LocationSource = 'dispositivo' | 'prueba';

export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  source: LocationSource;
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  /** Obligatorio en contactos nuevos; los guardados antes de existir el campo pueden no tenerlo. */
  email?: string;
  isSeed: boolean;
  createdAt: string;
}

/** Origen de la activación del SOS. */
export type AlertSource = 'app' | 'acceso_rapido' | 'deteccion_automatica';

export type ThemePref = 'sistema' | 'claro' | 'oscuro';
export type { Lang };

/** Sonido de la alarma: sirena (alcance) o silbato de rescate (tres pitidos agudos, se oye entre escombros). */
export type AlarmSound = 'sirena' | 'silbato';

export interface SusResponse {
  id: string;
  answeredAt: string;
  /** Respuestas 1–5 a las 10 afirmaciones del cuestionario SUS, en orden. */
  answers: number[];
  /** Puntaje SUS 0–100. */
  score: number;
  /** Id de la alerta de simulacro que se acababa de hacer, si aplica. */
  drillAlertId?: string;
}

export interface KitItem {
  id: string;
  name: string;
  checked: boolean;
  /** Fecha de vencimiento AAAA-MM-DD (agua, pilas, medicamentos...). */
  expiresOn?: string;
  isDefault: boolean;
}

export interface EmergencyKit {
  items: KitItem[];
  lastReviewedAt?: string;
}

/**
 * Marcas de tiempo (ms desde epoch) de una activación, para las métricas de validación.
 * Un campo ausente significa que esa señal no se activó o no se alcanzó a medir.
 */
export interface AlertMetrics {
  sosPressedAt?: number;
  confirmedAt?: number;
  sirenAt?: number;
  torchAt?: number;
  vibrationAt?: number;
  smsAt?: number;
  /** Momento en que el simulacro dio la señal de «¡Active la alerta!». */
  drillSignalAt?: number;
}

export interface AlertRecord {
  id: string;
  eventType: EventType;
  status: AlertLifecycle;
  activatedAt: string;
  endedAt?: string;
  location: LocationSnapshot | null;
  digitalStatus: DeliveryStatus;
  /** true cuando el estado del canal digital es una simulación de demostración. */
  simulatedDelivery: boolean;
  contactsCount: number;
  /** true para registros de ejemplo precargados por el modo de demostración. */
  isSeed: boolean;
  note?: string;
  metrics?: AlertMetrics;
  /** true si la alerta se activó durante un simulacro. */
  isDrill?: boolean;
  source?: AlertSource;
  /** Número de veces que se actualizó la ubicación durante la alerta. */
  locationUpdates?: number;
  /** Correo a los contactos (ausente = aún no se ha preguntado). */
  emailStatus?: EmailStatus;
  /**
   * Pasos marcados de la lista «Después del sismo» para ESTA alerta. Cada SOS empieza con la lista vacía y
   * las anteriores se conservan con su alerta (listas para migrar a una base de datos).
   */
  postQuakeDone?: number[];
}

/**
 * Estado del correo de alerta a los contactos:
 * - 'enviado': el servidor confirmó la recepción de la solicitud.
 * - 'cancelado': la persona respondió «No».
 * - 'sin_servidor': aún no hay servidor de correo configurado (VITE_ALERT_EMAIL_URL); no se envió nada.
 * - 'sin_destinatarios': ningún contacto real tiene correo.
 * - 'fallido': el servidor no respondió o devolvió error.
 */
export type EmailStatus = 'enviado' | 'cancelado' | 'sin_servidor' | 'sin_destinatarios' | 'fallido';

export interface MedicalInfo {
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  notes: string;
  /** Consentimiento para mostrarla en la pantalla de alerta (visible para quien tenga el teléfono). */
  showOnAlert: boolean;
}

export interface MeetingPoint {
  label: string;
  latitude: number;
  longitude: number;
}

export interface Settings {
  userName: string;
  soundEnabled: boolean;
  visualSignalEnabled: boolean;
  vibrationEnabled: boolean;
  alarmSound: AlarmSound;
  language: Lang;
  /** 'sistema' sigue el modo claro/oscuro del teléfono. */
  theme: ThemePref;
  /** Detección de caída o impacto fuerte con el acelerómetro (desactivada por defecto por falsos positivos). */
  fallDetection: boolean;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  demoMode: boolean;
  onboarded: boolean;
}

export interface AppData {
  version: 1;
  settings: Settings;
  contacts: Contact[];
  alerts: AlertRecord[];
  activeAlertId: string | null;
  lastLocation: LocationSnapshot | null;
  locationPermission: LocationPermission;
  /** Ficha médica opcional; se guarda solo en este dispositivo y nunca se envía. */
  medical: MedicalInfo | null;
  meetingPoint: MeetingPoint | null;
  susResponses: SusResponse[];
  kit: EmergencyKit | null;
  /** Lista «Después del sismo» de práctica, usada solo mientras no se ha activado ninguna alerta real. */
  postQuakeDone: number[];
}

export type ContactInput = Pick<Contact, 'name' | 'relationship' | 'phone'> & { email: string };
