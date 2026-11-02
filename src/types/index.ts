// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/** Ciclo de vida local de una alerta (solo en este dispositivo). */
export type AlertLifecycle = 'activa' | 'finalizada';

/**
 * Estado del canal digital (mensaje a contactos).
 * El prototipo NO envía mensajes reales: 'enviada' y 'fallida' solo existen
 * como simulación del modo de demostración o como datos de ejemplo.
 */
export type DeliveryStatus = 'pendiente' | 'enviada' | 'fallida' | 'no_disponible';

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
}

export interface Settings {
  userName: string;
  soundEnabled: boolean;
  visualSignalEnabled: boolean;
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
}

export type ContactInput = Pick<Contact, 'name' | 'relationship' | 'phone'>;
