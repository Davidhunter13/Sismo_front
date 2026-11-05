// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AlertRecord, AppData, MeetingPoint, Settings } from '../types';
import { normalizePostQuake } from './catalogService';
import { devOrProd } from '../utils/env';

const STORAGE_KEY = 'sismo:v1:data';

export const defaultSettings: Settings = {
  // En producción no aparece «demo» en ningún texto (ver utils/env).
  userName: devOrProd('Usuario demo', 'Usuario'),
  soundEnabled: true,
  visualSignalEnabled: true,
  vibrationEnabled: true,
  alarmSound: 'sirena',
  // Idioma inicial según el teléfono o navegador; el usuario puede cambiarlo en Configuración.
  language: typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es',
  theme: 'sistema',
  fallDetection: false,
  lowBatterySaver: 20,
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  demoMode: false,
  onboarded: false,
};

export function createEmptyData(): AppData {
  return {
    version: 1,
    settings: { ...defaultSettings },
    contacts: [],
    alerts: [],
    activeAlertId: null,
    lastLocation: null,
    locationPermission: 'sin_solicitar',
    medical: null,
    meetingPoints: [],
    susResponses: [],
    kit: null,
    postQuakeDone: [],
  };
}

/** Lee el estado guardado. Si no existe o está corrupto, devuelve un estado vacío. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.version !== 1) return createEmptyData();
    const empty = createEmptyData();
    // Versiones anteriores guardaban un solo punto de encuentro (`meetingPoint`): se convierte en lista.
    const { meetingPoint: legacyPoint, ...rest } = parsed as Partial<AppData> & { meetingPoint?: Omit<MeetingPoint, 'id'> | null };
    return {
      ...empty,
      ...rest,
      settings: { ...empty.settings, ...parsed.settings },
      meetingPoints: Array.isArray(rest.meetingPoints) ? rest.meetingPoints : legacyPoint ? [{ ...legacyPoint, id: newId() }] : [],
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      // El avance de «Después del sismo» se guardaba por posición: se pasa a claves estables de paso.
      alerts: Array.isArray(parsed.alerts)
        ? parsed.alerts.map((a: AlertRecord) => (a.postQuakeDone ? { ...a, postQuakeDone: normalizePostQuake(a.postQuakeDone) } : a))
        : [],
      susResponses: Array.isArray(parsed.susResponses) ? parsed.susResponses : [],
      postQuakeDone: normalizePostQuake(parsed.postQuakeDone),
    };
  } catch {
    return createEmptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Almacenamiento no disponible (modo privado o cuota llena): la app sigue en memoria.
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorado: ver saveData.
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
