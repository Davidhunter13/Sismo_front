// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AlertRecord, AlertSource, AppData, ContactInput, EventType, LocationPermission, LocationSnapshot, MedicalInfo, MeetingPoint, Settings,
} from '../types';
import { clearData, createEmptyData, loadData, newId, saveData } from '../services/storageService';
import { demoAlerts, demoContacts } from '../services/demoData';
import { requestDeviceLocation } from '../services/locationService';
import { takeTrace } from '../services/metricsService';
import { keepScreenOn } from '../services/screenService';
import { stopAlertSignals } from '../services/signalsService';
import { AppStateContext, type AppStateValue, type DrillState } from './appContext';

/** Tiempo de la entrega SIMULADA del canal digital en modo de demostración. */
const SIMULATED_DELIVERY_MS = 3500;
/** Cada cuánto se actualiza la ubicación durante una alerta activa. */
const LOCATION_REFRESH_MS = 2 * 60_000;
/** Espera aleatoria del simulacro antes de dar la señal. */
const DRILL_MIN_DELAY_MS = 3_000;
const DRILL_MAX_DELAY_MS = 10_000;

function withDemoSeeds(data: AppData): AppData {
  const contacts = data.contacts.filter((c) => !c.isSeed);
  const alerts = data.alerts.filter((a) => !a.isSeed);
  return { ...data, contacts: [...demoContacts(), ...contacts], alerts: [...alerts, ...demoAlerts()] };
}

function withoutDemoSeeds(data: AppData): AppData {
  return { ...data, contacts: data.contacts.filter((c) => !c.isSeed), alerts: data.alerts.filter((a) => !a.isSeed) };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  // El simulacro no se guarda: si se cierra la app, se cancela.
  const [drill, setDrill] = useState<DrillState | null>(null);

  useEffect(() => saveData(data), [data]);

  // Atributos de accesibilidad en <html> (Ionic reescribe sus clases al iniciar).
  useEffect(() => {
    const { highContrast, largeText, reduceMotion } = data.settings;
    const root = document.documentElement;
    root.toggleAttribute('data-a11y-contrast', highContrast);
    root.toggleAttribute('data-a11y-large-text', largeText);
    root.toggleAttribute('data-a11y-reduce-motion', reduceMotion);
  }, [data.settings]);

  const activeAlert = useMemo(
    () => data.alerts.find((a) => a.id === data.activeAlertId) ?? null,
    [data.alerts, data.activeAlertId],
  );

  // Simulación del canal digital (solo en modo de demostración). No se envía nada.
  useEffect(() => {
    if (!activeAlert || activeAlert.digitalStatus !== 'pendiente' || !activeAlert.simulatedDelivery) return;
    const id = activeAlert.id;
    const timer = window.setTimeout(() => {
      setData((d) => ({
        ...d,
        alerts: d.alerts.map((a) =>
          a.id === id && a.digitalStatus === 'pendiente'
            ? { ...a, digitalStatus: a.contactsCount > 0 ? 'enviada' : 'fallida' }
            : a,
        ),
      }));
    }, SIMULATED_DELIVERY_MS);
    return () => window.clearTimeout(timer);
  }, [activeAlert]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const addContact = useCallback((input: ContactInput) => {
    const contact = { ...input, id: newId(), isSeed: false, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, contacts: [...d.contacts, contact] }));
    return contact;
  }, []);

  const updateContact = useCallback((id: string, input: ContactInput) => {
    setData((d) => ({ ...d, contacts: d.contacts.map((c) => (c.id === id ? { ...c, ...input } : c)) }));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setData((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
  }, []);

  const activateAlert = useCallback(
    (eventType: EventType, source: AlertSource = 'app') => {
      const simulated = data.settings.demoMode;
      const metrics = takeTrace();
      const alert: AlertRecord = {
        id: newId(),
        eventType,
        status: 'activa',
        activatedAt: new Date().toISOString(),
        location: data.lastLocation,
        digitalStatus: simulated ? 'pendiente' : 'no_disponible',
        simulatedDelivery: simulated,
        contactsCount: data.contacts.length,
        isSeed: false,
        metrics,
        // Si se activa antes de la señal, cuenta como simulacro pero sin tiempo de reacción.
        isDrill: drill !== null,
        source,
        locationUpdates: 0,
      };
      setDrill(null);
      setData((d) => ({
        ...d,
        // Si hubiera otra alerta activa, se cierra para mantener una sola.
        alerts: [alert, ...d.alerts.map((a) => (a.status === 'activa' ? { ...a, status: 'finalizada' as const, endedAt: alert.activatedAt } : a))],
        activeAlertId: alert.id,
      }));
      return alert;
    },
    [data.settings.demoMode, data.lastLocation, data.contacts.length, drill],
  );

  // Pantalla encendida mientras haya una alerta activa.
  const hasActiveAlert = activeAlert !== null;
  useEffect(() => {
    void keepScreenOn(hasActiveAlert);
  }, [hasActiveAlert]);

  // Ubicación actualizada durante la alerta: al activarla y cada LOCATION_REFRESH_MS, si hay permiso.
  // Solo se guarda en el dispositivo; el SMS usa la más reciente.
  const activeAlertId = activeAlert?.id;
  const canLocate = data.locationPermission === 'concedido';
  useEffect(() => {
    if (!activeAlertId || !canLocate) return;
    let cancelled = false;
    const refresh = async () => {
      const result = await requestDeviceLocation();
      if (cancelled || !result.snapshot) return;
      const snapshot = result.snapshot;
      setData((d) => ({
        ...d,
        lastLocation: snapshot,
        alerts: d.alerts.map((a) =>
          a.id === activeAlertId && a.status === 'activa'
            ? { ...a, location: snapshot, locationUpdates: (a.locationUpdates ?? 0) + 1 }
            : a,
        ),
      }));
    };
    void refresh();
    const timer = window.setInterval(refresh, LOCATION_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeAlertId, canLocate]);

  const startDrill = useCallback(() => {
    setDrill({ phase: 'esperando' });
    // Espera aleatoria para que la señal no sea predecible.
    const delay = DRILL_MIN_DELAY_MS + Math.random() * (DRILL_MAX_DELAY_MS - DRILL_MIN_DELAY_MS);
    window.setTimeout(() => {
      setDrill((current) => (current?.phase === 'esperando' ? { phase: 'senal', signalAt: Date.now() } : current));
    }, delay);
  }, []);

  const cancelDrill = useCallback(() => setDrill(null), []);

  const endAlert = useCallback(() => {
    stopAlertSignals();
    setData((d) => ({
      ...d,
      activeAlertId: null,
      alerts: d.alerts.map((a) =>
        a.id === d.activeAlertId ? { ...a, status: 'finalizada', endedAt: new Date().toISOString() } : a,
      ),
    }));
  }, []);

  const markSmsOpened = useCallback(() => {
    const at = Date.now();
    setData((d) => ({
      ...d,
      alerts: d.alerts.map((a) =>
        a.id === d.activeAlertId
          ? { ...a, digitalStatus: 'sms_abierto', simulatedDelivery: false, metrics: { ...a.metrics, smsAt: a.metrics?.smsAt ?? at } }
          : a,
      ),
    }));
  }, []);

  const setMedical = useCallback((medical: MedicalInfo | null) => {
    setData((d) => ({ ...d, medical }));
  }, []);

  const setMeetingPoint = useCallback((meetingPoint: MeetingPoint | null) => {
    setData((d) => ({ ...d, meetingPoint }));
  }, []);

  const setLocation = useCallback((snapshot: LocationSnapshot | null, permission?: LocationPermission) => {
    setData((d) => ({ ...d, lastLocation: snapshot, locationPermission: permission ?? d.locationPermission }));
  }, []);

  const setLocationPermission = useCallback((permission: LocationPermission) => {
    setData((d) => (d.locationPermission === permission ? d : { ...d, locationPermission: permission }));
  }, []);

  const setDemoMode = useCallback((enabled: boolean) => {
    setData((d) => {
      const base = enabled ? withDemoSeeds(d) : withoutDemoSeeds(d);
      return { ...base, settings: { ...base.settings, demoMode: enabled } };
    });
  }, []);

  const resetDemoData = useCallback(() => {
    stopAlertSignals();
    setData((d) => {
      const fresh = createEmptyData();
      const settings: Settings = { ...d.settings, demoMode: true };
      return withDemoSeeds({ ...fresh, settings, locationPermission: d.locationPermission });
    });
  }, []);

  const resetAll = useCallback(() => {
    stopAlertSignals();
    clearData();
    setData(createEmptyData());
  }, []);

  const value: AppStateValue = {
    data,
    activeAlert,
    updateSettings,
    addContact,
    updateContact,
    deleteContact,
    activateAlert,
    endAlert,
    markSmsOpened,
    drill,
    startDrill,
    cancelDrill,
    setMedical,
    setMeetingPoint,
    setLocation,
    setLocationPermission,
    setDemoMode,
    resetDemoData,
    resetAll,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
