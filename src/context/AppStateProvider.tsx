// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AlertPriorityPatch, AlertRecord, AlertSource, AppData, ContactInput, EmailStatus, EmergencyKit, EventType, LocationPermission, LocationSnapshot, MedicalInfo, MeetingPoint,
  Settings, SusResponse,
} from '../types';
import { setLang } from '../i18n';
import { clearData, createEmptyData, loadData, newId, saveData } from '../services/storageService';
import { queueChanges, startSync, type ServerState } from '../services/syncService';
import { ensureFirstRefresh, getCatalogs, normalizePostQuake, refreshCatalogs, useCatalogs } from '../services/catalogService';
import { DEMO_ENABLED } from '../utils/env';
import { demoAlerts, demoContacts } from '../services/demoData';
import { requestDeviceLocation } from '../services/locationService';
import { takeTrace } from '../services/metricsService';
import { maxMeetingPoints } from '../utils/meetingPoints';
import { keepScreenOn, showOverLockScreen } from '../services/screenService';
import { stopAlertSignals } from '../services/signalsService';
import { AppStateContext, type AppStateValue, type DrillState } from './appContext';

/** Tiempo de la entrega SIMULADA del canal digital en modo de demostración. */
const SIMULATED_DELIVERY_MS = 3500;
// Cada cuánto se actualiza la ubicación durante una alerta y la espera aleatoria del simulacro: son
// parámetros administrables (catálogo `params`), se leen al usarse.

function withDemoSeeds(data: AppData): AppData {
  const contacts = data.contacts.filter((c) => !c.isSeed);
  const alerts = data.alerts.filter((a) => !a.isSeed);
  return { ...data, contacts: [...demoContacts(), ...contacts], alerts: [...alerts, ...demoAlerts()] };
}

function withoutDemoSeeds(data: AppData): AppData {
  return { ...data, contacts: data.contacts.filter((c) => !c.isSeed), alerts: data.alerts.filter((a) => !a.isSeed) };
}

/** En producción no existe el modo de demostración: se apaga y se quitan los datos ficticios que hubiera. */
function loadInitialData(): AppData {
  const loaded = loadData();
  if (DEMO_ENABLED || (!loaded.settings.demoMode && !loaded.contacts.some((c) => c.isSeed) && !loaded.alerts.some((a) => a.isSeed))) return loaded;
  const clean = withoutDemoSeeds(loaded);
  return { ...clean, settings: { ...clean.settings, demoMode: false } };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitialData);
  // El simulacro no se guarda: si se cierra la app, se cancela.
  const [drill, setDrill] = useState<DrillState | null>(null);
  // Copia siempre actualizada: activateAlert puede ejecutarse desde una vista con un cierre antiguo
  // (Ionic conserva vistas montadas), así que el simulacro se lee de aquí y no del cierre.
  const drillRef = useRef<DrillState | null>(null);
  useEffect(() => {
    drillRef.current = drill;
  }, [drill]);

  useEffect(() => saveData(data), [data]);

  // Sincronización con el backend: cada cambio se encola (cola persistente) y se sube apenas haya red.
  const prevDataRef = useRef(data);
  const dataRef = useRef(data);
  dataRef.current = data;
  // Tras restaurar desde el servidor no se vuelve a subir lo que se acaba de descargar.
  const skipSyncRef = useRef(false);
  useEffect(() => {
    if (skipSyncRef.current) skipSyncRef.current = false;
    else queueChanges(prevDataRef.current, data);
    prevDataRef.current = data;
  }, [data]);
  useEffect(() => startSync(() => dataRef.current), []);

  // Catálogos administrables: se descargan al abrir y al recuperar la red; sin red se usa la última copia.
  // Suscribirse aquí vuelve a dibujar toda la app cuando llegan catálogos nuevos.
  const catalogs = useCatalogs();
  useEffect(() => {
    void ensureFirstRefresh();
    const onOnline = () => void refreshCatalogs();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Idioma activo para los servicios (SMS, etiquetas, fechas). Se fija durante el render para que
  // los textos calculados en este mismo render ya salgan en el idioma nuevo.
  setLang(data.settings.language);

  // Atributos de accesibilidad y tema en <html> (Ionic reescribe sus clases al iniciar).
  useEffect(() => {
    const { highContrast, largeText, reduceMotion, theme } = data.settings;
    const root = document.documentElement;
    root.toggleAttribute('data-a11y-contrast', highContrast);
    root.toggleAttribute('data-a11y-large-text', largeText);
    root.toggleAttribute('data-a11y-reduce-motion', reduceMotion);
    if (theme === 'sistema') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme === 'oscuro' ? 'dark' : 'light');
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
    (eventType: EventType, source: AlertSource = 'app', extra: { urgent?: boolean; fallNoResponse?: boolean } = {}) => {
      const simulated = data.settings.demoMode;
      const currentDrill = drillRef.current;
      const metrics = { ...takeTrace(), drillSignalAt: currentDrill?.signalAt };
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
        isDrill: currentDrill !== null,
        source,
        locationUpdates: 0,
        ...(extra.urgent ? { urgent: true, urgentAt: new Date().toISOString() } : {}),
        ...(extra.fallNoResponse ? { fallNoResponse: true } : {}),
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
    [data.settings.demoMode, data.lastLocation, data.contacts.length],
  );

  // Pantalla encendida mientras haya una alerta activa.
  const hasActiveAlert = activeAlert !== null;
  useEffect(() => {
    void keepScreenOn(hasActiveAlert);
    // Durante la alerta, visible sobre la pantalla de bloqueo (ficha médica para rescatistas).
    void showOverLockScreen(hasActiveAlert);
  }, [hasActiveAlert]);

  // Ubicación automática durante la alerta: se toma al activarla (aunque no hubiera una guardada; si el
  // permiso no se había pedido, se pide en ese momento) y se actualiza cada LOCATION_REFRESH_MS.
  // Solo se guarda en el dispositivo; el SMS usa la más reciente. No se insiste si el permiso fue denegado.
  const activeAlertId = activeAlert?.id;
  const canLocate = data.locationPermission !== 'denegado' && data.locationPermission !== 'no_disponible';
  useEffect(() => {
    if (!activeAlertId || !canLocate) return;
    let cancelled = false;
    const refresh = async () => {
      const result = await requestDeviceLocation();
      if (cancelled) return;
      if (!result.snapshot) {
        // Sin señal o tiempo agotado: se reintenta en el siguiente ciclo. Solo un rechazo detiene los intentos.
        if (result.permission === 'denegado') setData((d) => ({ ...d, locationPermission: 'denegado' }));
        return;
      }
      const snapshot = result.snapshot;
      setData((d) => ({
        ...d,
        locationPermission: 'concedido',
        lastLocation: snapshot,
        alerts: d.alerts.map((a) =>
          a.id === activeAlertId && a.status === 'activa'
            ? { ...a, location: snapshot, locationUpdates: (a.locationUpdates ?? 0) + 1 }
            : a,
        ),
      }));
    };
    void refresh();
    const timer = window.setInterval(refresh, catalogs.params.alertLocationRefreshMin * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeAlertId, canLocate, catalogs.params.alertLocationRefreshMin]);

  const startDrill = useCallback(() => {
    setDrill({ phase: 'esperando' });
    // Espera aleatoria para que la señal no sea predecible.
    const { drillDelayMinS, drillDelayMaxS } = getCatalogs().params;
    const delay = (drillDelayMinS + Math.random() * (drillDelayMaxS - drillDelayMinS)) * 1000;
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

  const addMeetingPoint = useCallback((input: Omit<MeetingPoint, 'id'>) => {
    const point: MeetingPoint = { ...input, id: newId() };
    setData((d) => ({ ...d, meetingPoints: [...d.meetingPoints, point].slice(-maxMeetingPoints()) }));
    return point;
  }, []);

  const removeMeetingPoint = useCallback((id: string) => {
    setData((d) => ({ ...d, meetingPoints: d.meetingPoints.filter((p) => p.id !== id) }));
  }, []);

  const addSusResponse = useCallback((response: SusResponse) => {
    setData((d) => ({ ...d, susResponses: [response, ...d.susResponses] }));
  }, []);

  const setKit = useCallback((kit: EmergencyKit | null) => {
    setData((d) => ({ ...d, kit }));
  }, []);

  const updateActiveAlert = useCallback((patch: AlertPriorityPatch) => {
    setData((d) => {
      const current = d.alerts.find((a) => a.id === d.activeAlertId);
      // Sin cambios reales no se toca el estado (evita sincronizaciones innecesarias).
      if (!current || (Object.keys(patch) as (keyof AlertPriorityPatch)[]).every((k) => current[k] === patch[k])) return d;
      return { ...d, alerts: d.alerts.map((a) => (a.id === d.activeAlertId ? { ...a, ...patch } : a)) };
    });
  }, []);

  const setEmailStatus = useCallback((alertId: string, emailStatus: EmailStatus) => {
    setData((d) => ({ ...d, alerts: d.alerts.map((a) => (a.id === alertId ? { ...a, emailStatus } : a)) }));
  }, []);

  /** Con alertId guarda el avance en esa alerta; sin él, en la lista de práctica (sin alertas). */
  const setPostQuakeDone = useCallback((postQuakeDone: string[], alertId?: string) => {
    setData((d) =>
      alertId
        ? { ...d, alerts: d.alerts.map((a) => (a.id === alertId ? { ...a, postQuakeDone } : a)) }
        : { ...d, postQuakeDone },
    );
  }, []);

  const setLocation = useCallback((snapshot: LocationSnapshot | null, permission?: LocationPermission) => {
    setData((d) => ({ ...d, lastLocation: snapshot, locationPermission: permission ?? d.locationPermission }));
  }, []);

  const setLocationPermission = useCallback((permission: LocationPermission) => {
    setData((d) => (d.locationPermission === permission ? d : { ...d, locationPermission: permission }));
  }, []);

  const setDemoMode = useCallback((enabled: boolean) => {
    if (enabled && !DEMO_ENABLED) return;
    setData((d) => {
      const base = enabled ? withDemoSeeds(d) : withoutDemoSeeds(d);
      return { ...base, settings: { ...base.settings, demoMode: enabled } };
    });
  }, []);

  const resetDemoData = useCallback(() => {
    if (!DEMO_ENABLED) return;
    stopAlertSignals();
    setData((d) => {
      const fresh = createEmptyData();
      const settings: Settings = { ...d.settings, demoMode: true };
      return withDemoSeeds({ ...fresh, settings, locationPermission: d.locationPermission });
    });
  }, []);

  /** Reemplaza los datos del teléfono por los recuperados del servidor (teléfono perdido o nuevo). */
  const restoreFromServer = useCallback((server: ServerState) => {
    stopAlertSignals();
    skipSyncRef.current = true;
    setData((d) => {
      const empty = createEmptyData();
      const alerts = (Array.isArray(server.alerts) ? server.alerts : []).map((a) =>
        a.postQuakeDone ? { ...a, postQuakeDone: normalizePostQuake(a.postQuakeDone) } : a);
      return {
        ...empty,
        settings: server.settings ? { ...empty.settings, ...server.settings } : d.settings,
        contacts: Array.isArray(server.contacts) ? server.contacts : [],
        alerts,
        activeAlertId: alerts.find((a) => a.status === 'activa')?.id ?? null,
        lastLocation: server.lastLocation ?? null,
        locationPermission: d.locationPermission,
        medical: server.medical ?? null,
        meetingPoints: Array.isArray(server.meetingPoints) ? server.meetingPoints : [],
        susResponses: Array.isArray(server.susResponses) ? server.susResponses : [],
        kit: server.kit ?? null,
        postQuakeDone: normalizePostQuake(server.postQuakeDone),
      };
    });
  }, []);

  const wipeAfterAccountDeletion = useCallback(() => {
    stopAlertSignals();
    skipSyncRef.current = true; // la cuenta ya se borró en el servidor: no se encolan cambios
    clearData();
    setData(createEmptyData());
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
    addMeetingPoint,
    removeMeetingPoint,
    addSusResponse,
    setKit,
    setPostQuakeDone,
    setEmailStatus,
    updateActiveAlert,
    setLocation,
    setLocationPermission,
    setDemoMode,
    resetDemoData,
    resetAll,
    wipeAfterAccountDeletion,
    restoreFromServer,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
