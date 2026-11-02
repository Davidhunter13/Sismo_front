// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { createContext, useContext } from 'react';
import type {
  AlertRecord, AlertSource, AppData, Contact, ContactInput, EmergencyKit, EventType, LocationPermission, LocationSnapshot, MedicalInfo,
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
  setMeetingPoint: (point: MeetingPoint | null) => void;
  addSusResponse: (response: SusResponse) => void;
  setKit: (kit: EmergencyKit | null) => void;
  setLocation: (snapshot: LocationSnapshot | null, permission?: LocationPermission) => void;
  setLocationPermission: (permission: LocationPermission) => void;
  setDemoMode: (enabled: boolean) => void;
  resetDemoData: () => void;
  resetAll: () => void;
}

export const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return value;
}
