// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

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
  isSeed: boolean;
  createdAt: string;
}

/** Origen de la activación del SOS. */
export type AlertSource = 'app' | 'acceso_rapido';

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
}

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
}

export type ContactInput = Pick<Contact, 'name' | 'relationship' | 'phone'>;
