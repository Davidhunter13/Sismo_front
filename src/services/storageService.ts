// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AppData, Settings } from '../types';

const STORAGE_KEY = 'sismo:v1:data';

export const defaultSettings: Settings = {
  userName: 'Usuario demo',
  soundEnabled: true,
  visualSignalEnabled: true,
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
    return {
      ...empty,
      ...parsed,
      settings: { ...empty.settings, ...parsed.settings },
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
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
