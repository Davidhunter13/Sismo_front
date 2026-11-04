// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { createContext, useContext, type Context } from 'react';
import type { ServerState } from '../services/syncService';
import type {
  AlertRecord, AlertSource, AppData, Contact, ContactInput, EmailStatus, EmergencyKit, EventType, LocationPermission, LocationSnapshot, MedicalInfo,
  MeetingPoint, Settings, SusResponse,
} from '../types';

/** Simulacro en curso: primero se espera un tiempo aleatorio y luego se da la señal. */
export type DrillState = { phase: 'esperando'; signalAt?: undefined } | { phase: 'senal'; signalAt: number };

export interface AppStateValue {
  data: AppData;
  activeAlert: AlertRecord | null;
  updateSettings: (patch: Partial<Settings>) => void;
  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: ContactInput) => void;
  deleteContact: (id: string) => void;
  activateAlert: (eventType: EventType, source?: AlertSource) => AlertRecord;
  endAlert: () => void;
  /** Registra que se abrió la app de SMS para la alerta activa (reemplaza cualquier simulación). */
  markSmsOpened: () => void;
  drill: DrillState | null;
  startDrill: () => void;
  cancelDrill: () => void;
  setMedical: (medical: MedicalInfo | null) => void;
  /** Agrega un punto de encuentro (máximo MAX_MEETING_POINTS; si se supera, sale el más antiguo). */
  addMeetingPoint: (point: Omit<MeetingPoint, 'id'>) => MeetingPoint;
  removeMeetingPoint: (id: string) => void;
  addSusResponse: (response: SusResponse) => void;
  setKit: (kit: EmergencyKit | null) => void;
  /** Claves de los pasos marcados de «Después del sismo» (catálogo). */
  setPostQuakeDone: (done: string[], alertId?: string) => void;
  setEmailStatus: (alertId: string, status: EmailStatus) => void;
  setLocation: (snapshot: LocationSnapshot | null, permission?: LocationPermission) => void;
  setLocationPermission: (permission: LocationPermission) => void;
  setDemoMode: (enabled: boolean) => void;
  resetDemoData: () => void;
  resetAll: () => void;
  /** Tras eliminar la cuenta: borra todo en el teléfono sin enviar nada al servidor. */
  wipeAfterAccountDeletion: () => void;
  /** Reemplaza los datos locales por los recuperados del servidor. */
  restoreFromServer: (server: ServerState) => void;
}

/**
 * El contexto se guarda en globalThis para que sobreviva a la recarga en caliente de Vite (Fast Refresh): al
 * reevaluarse este módulo no se crea un contexto nuevo distinto del que usa el proveedor ya montado.
 */
const globalScope = globalThis as typeof globalThis & { __sismoAppStateContext?: Context<AppStateValue | null> };
export const AppStateContext: Context<AppStateValue | null> =
  globalScope.__sismoAppStateContext ?? (globalScope.__sismoAppStateContext = createContext<AppStateValue | null>(null));

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return value;
}
