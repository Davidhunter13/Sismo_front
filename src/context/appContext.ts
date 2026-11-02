// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { createContext, useContext } from 'react';
import type { AlertRecord, AppData, Contact, ContactInput, EventType, LocationPermission, LocationSnapshot, Settings } from '../types';

export interface AppStateValue {
  data: AppData;
  activeAlert: AlertRecord | null;
  updateSettings: (patch: Partial<Settings>) => void;
  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: ContactInput) => void;
  deleteContact: (id: string) => void;
  activateAlert: (eventType: EventType) => AlertRecord;
  endAlert: () => void;
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
