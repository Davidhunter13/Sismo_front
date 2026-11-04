// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AppData } from '../types';
import { createEmptyData } from './storageService';

/**
 * Sincronización con el backend (API REST en CodeIgniter 3, ver docs/segunda_entrega/BACKEND_Y_SINCRONIZACION.md).
 *
 * Offline-first: el teléfono sigue siendo la fuente inmediata (localStorage) y cada cambio se convierte en
 * operaciones por recurso que van a una COLA PERSISTENTE (`sismo:v1:outbox`). La cola sobrevive sin red y al
 * cerrar la app; se vacía apenas hay conexión (evento `online`, al abrir la app, al volver a primer plano y
 * cada minuto). Todas las operaciones son idempotentes (PUT/DELETE por id), así que reenviarlas no duplica.
 *
 * Al registrarse el dispositivo por primera vez se encola TODO lo que ya estaba guardado (historial de
 * alertas, métricas, encuestas, contactos, kit…), para que nada de lo hecho sin servidor se pierda.
 * Los datos de demostración (`isSeed`) nunca se envían.
 */

export interface SyncOp {
  /** Recurso afectado; una operación nueva reemplaza a la pendiente con la misma clave. */
  key: string;
  method: 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

interface Device {
  uuid: string;
  token: string;
}

const OUTBOX_KEY = 'sismo:v1:outbox';
const DEVICE_KEY = 'sismo:v1:dispositivo';
const TIMEOUT_MS = 10_000;
const RETRY_EVERY_MS = 60_000;
/** Reintentos inmediatos ante 429/5xx/red (espera exponencial 1 s, 2 s, 4 s); después espera al siguiente ciclo. */
const RETRIES = 3;

/** URL base del API, o null si no está configurada (la app funciona igual, solo en el teléfono). */
export function syncEndpoint(): string | null {
  const url = (import.meta.env.VITE_SISMO_API_URL as string | undefined)?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

// ------------------------------------------------------------------ Diferencias -> operaciones

type WithId = { id: string; isSeed?: boolean };

function diffById<T extends WithId>(resource: string, prev: T[], next: T[]): SyncOp[] {
  const ops: SyncOp[] = [];
  const before = new Map(prev.filter((x) => !x.isSeed).map((x) => [x.id, x]));
  const after = next.filter((x) => !x.isSeed);
  for (const item of after) {
    const old = before.get(item.id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
      ops.push({ key: `${resource}:${item.id}`, method: 'PUT', path: `${resource}/${encodeURIComponent(item.id)}`, body: item });
    }
    before.delete(item.id);
  }
  for (const id of before.keys()) {
    ops.push({ key: `${resource}:${id}`, method: 'DELETE', path: `${resource}/${encodeURIComponent(id)}` });
  }
  return ops;
}

function settingsBody(d: AppData) {
  return { settings: d.settings, locationPermission: d.locationPermission, lastLocation: d.lastLocation, postQuakeDone: d.postQuakeDone };
}

const settingsOp = (d: AppData): SyncOp => ({ key: 'ajustes', method: 'PUT', path: 'ajustes', body: settingsBody(d) });
const kitOp = (d: AppData): SyncOp => ({ key: 'inventario', method: 'PUT', path: 'inventario', body: d.kit });
const medicalOp = (d: AppData): SyncOp =>
  d.medical
    ? { key: 'ficha_medica', method: 'PUT', path: 'ficha_medica', body: d.medical }
    : { key: 'ficha_medica', method: 'DELETE', path: 'ficha_medica' };

/** Operaciones necesarias para llevar al servidor del estado `prev` al estado `next`. Función pura. */
export function diffOperations(prev: AppData, next: AppData): SyncOp[] {
  if (prev === next) return [];
  const ops: SyncOp[] = [];
  if (JSON.stringify(settingsBody(prev)) !== JSON.stringify(settingsBody(next))) ops.push(settingsOp(next));
  ops.push(...diffById('contactos', prev.contacts, next.contacts));
  ops.push(...diffById('alertas', prev.alerts, next.alerts));
  ops.push(...diffById('puntos_encuentro', prev.meetingPoints, next.meetingPoints));
  ops.push(...diffById('encuestas', prev.susResponses, next.susResponses));
  if (JSON.stringify(prev.kit) !== JSON.stringify(next.kit)) ops.push(kitOp(next));
  if (JSON.stringify(prev.medical) !== JSON.stringify(next.medical)) ops.push(medicalOp(next));
  return ops;
}

/** Todo lo guardado en el teléfono, para la primera sincronización (o tras perder el registro). */
export function fullSyncOperations(data: AppData): SyncOp[] {
  const ops = diffOperations(createEmptyData(), data).filter((op) => op.key !== 'ajustes' && op.key !== 'inventario' && op.key !== 'ficha_medica');
  ops.unshift(settingsOp(data));
  if (data.kit) ops.push(kitOp(data));
  if (data.medical) ops.push(medicalOp(data));
  return ops;
}

/** Añade operaciones a la cola; la nueva reemplaza a la pendiente del mismo recurso. */
export function mergeOutbox(outbox: SyncOp[], ops: SyncOp[]): SyncOp[] {
  const keys = new Set(ops.map((o) => o.key));
  return [...outbox.filter((o) => !keys.has(o.key)), ...ops];
}

// ------------------------------------------------------------------ Almacenamiento local de la cola

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: la cola vive en memoria hasta que se envíe.
  }
}

let memoryOutbox: SyncOp[] | null = null;

// ------------------------------------------------------------------ Estado visible (aviso «sin conexión»)

/** false cuando hay internet pero el servidor no respondió (caído, túnel o red saturada). */
let serverReachable = true;
const statusListeners = new Set<() => void>();
const emitStatus = () => statusListeners.forEach((l) => l());

function setServerReachable(value: boolean): void {
  if (serverReachable === value) return;
  serverReachable = value;
  emitStatus();
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

/** Resumen para la interfaz: cambios pendientes y si el servidor respondió la última vez. */
export function getSyncStatus(): string {
  return `${loadOutbox().length}|${serverReachable ? 1 : 0}`;
}

export function loadOutbox(): SyncOp[] {
  if (memoryOutbox) return memoryOutbox;
  const stored = read<unknown>(OUTBOX_KEY, []);
  memoryOutbox = Array.isArray(stored) ? (stored as SyncOp[]) : [];
  return memoryOutbox;
}

function saveOutbox(outbox: SyncOp[]): void {
  memoryOutbox = outbox;
  write(OUTBOX_KEY, outbox);
  emitStatus();
}

/** Número de cambios pendientes de subir. */
export function pendingCount(): number {
  return loadOutbox().length;
}

/** Encola los cambios entre dos estados y trata de enviarlos. No hace nada si no hay API configurada. */
export function queueChanges(prev: AppData, next: AppData): void {
  if (!syncEndpoint()) return;
  const ops = diffOperations(prev, next);
  if (ops.length === 0) return;
  saveOutbox(mergeOutbox(loadOutbox(), ops));
  void flush();
}

// ------------------------------------------------------------------ Red

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Outcome = 'ok' | 'retry' | 'drop' | 'unauthorized';

async function send(base: string, op: { method: string; path: string; body?: unknown }, token?: string): Promise<{ outcome: Outcome; json?: unknown }> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/${op.path}`, {
        method: op.method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: op.method === 'PUT' || op.method === 'POST' ? JSON.stringify(op.body ?? null) : undefined,
        signal: ctrl.signal,
      });
      if (res.ok) {
        setServerReachable(true);
        return { outcome: 'ok', json: await res.json().catch(() => null) };
      }
      if (res.status < 500 && res.status !== 429) setServerReachable(true);
      if (res.status === 401) return { outcome: 'unauthorized' };
      // 503 = el servidor aún no puede guardar ese dato (p. ej. cifrado sin configurar): se conserva para después.
      if (res.status === 503) return { outcome: 'retry' };
      // Otros 4xx: la operación es inválida y reintentarla no ayuda; se descarta para no bloquear la cola.
      if (res.status !== 429 && res.status < 500) return { outcome: 'drop' };
    } catch {
      // Sin red o tiempo agotado.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return { outcome: 'retry' };
    } finally {
      clearTimeout(timer);
    }
    if (attempt < RETRIES) await wait(1000 * 2 ** attempt);
  }
  // Con internet pero sin respuesta útil del servidor: se avisa en la interfaz (los datos quedan en la cola).
  if (typeof navigator === 'undefined' || navigator.onLine !== false) setServerReachable(false);
  return { outcome: 'retry' };
}

let getData: (() => AppData) | null = null;
let flushing: Promise<void> | null = null;

async function ensureDevice(base: string): Promise<Device | null> {
  const known = read<Device | null>(DEVICE_KEY, null);
  if (known?.token) return known;
  const platform = /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad/i.test(navigator.userAgent) ? 'ios' : 'web';
  const { outcome, json } = await send(base, { method: 'POST', path: 'registro', body: { plataforma: platform } });
  const reply = json as { uuid_dispositivo?: string; token?: string } | null;
  if (outcome !== 'ok' || !reply?.token || !reply.uuid_dispositivo) return null;
  const device = { uuid: reply.uuid_dispositivo, token: reply.token };
  write(DEVICE_KEY, device);
  // Primer registro: se sube todo lo que ya existía en el teléfono (historial incluido).
  if (getData) saveOutbox(mergeOutbox(fullSyncOperations(getData()), loadOutbox()));
  return device;
}

/** Envía la cola en orden. Se detiene en el primer fallo de red y lo reintenta en el siguiente ciclo. */
export function flush(): Promise<void> {
  const base = syncEndpoint();
  if (!base) return Promise.resolve();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve();
  if (flushing) return flushing;
  flushing = (async () => {
    let device = await ensureDevice(base);
    if (!device) return;
    let reRegistered = false;
    while (loadOutbox().length > 0) {
      const op = loadOutbox()[0];
      const { outcome } = await send(base, op, device.token);
      if (outcome === 'retry') return;
      if (outcome === 'unauthorized') {
        // Token revocado, cuenta eliminada o base vaciada: se registra de nuevo de inmediato (una vez por ciclo)
        // y se resube todo lo del teléfono.
        write(DEVICE_KEY, null);
        if (reRegistered) return;
        reRegistered = true;
        device = await ensureDevice(base);
        if (!device) return;
        continue;
      }
      if (outcome === 'drop') console.warn('[sismo-sync] operación rechazada por el servidor', op.method, op.path);
      // Solo se quita si la operación sigue siendo la primera (pudo reemplazarse mientras viajaba).
      const current = loadOutbox();
      if (current[0] === op) saveOutbox(current.slice(1));
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/**
 * Arranca la sincronización. `data` devuelve el estado actual (para la primera subida completa).
 * Devuelve la función que detiene los temporizadores y oyentes.
 */
export function startSync(data: () => AppData): () => void {
  getData = data;
  if (!syncEndpoint()) return () => undefined;
  const run = () => void flush();
  const onVisible = () => {
    if (document.visibilityState === 'visible') run();
  };
  window.addEventListener('online', run);
  document.addEventListener('visibilitychange', onVisible);
  const timer = window.setInterval(run, RETRY_EVERY_MS);
  run();
  return () => {
    window.removeEventListener('online', run);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(timer);
  };
}

// ------------------------------------------------------------------ Recuperación y atención

/** Estado guardado en el servidor, con la misma forma que AppData (sin `version` ni `activeAlertId`). */
export type ServerState = Omit<AppData, 'version' | 'activeAlertId' | 'settings'> & { settings: AppData['settings'] | null };

/** Ayuda registrada por el centro de monitoreo para la alerta activa. */
export interface HelpStatus {
  alertId: string;
  status: 'en_atencion' | 'ayuda_enviada' | 'resuelta';
  note: string;
  at: string;
}

/** true si la app tiene servidor configurado (las opciones de respaldo solo se muestran entonces). */
export function syncEnabled(): boolean {
  return syncEndpoint() !== null;
}

/**
 * Crea un código de recuperación (no vence; uno nuevo invalida el anterior). Antes sube lo pendiente para que
 * el respaldo quede completo. Devuelve null sin red o sin servidor.
 */
export async function createRecoveryCode(): Promise<string | null> {
  const base = syncEndpoint();
  if (!base) return null;
  await flush();
  const device = read<Device | null>(DEVICE_KEY, null);
  if (!device) return null;
  const { outcome, json } = await send(base, { method: 'POST', path: 'codigo_recuperacion', body: {} }, device.token);
  const code = (json as { codigo?: string } | null)?.codigo;
  return outcome === 'ok' && code ? code : null;
}

export type RecoverResult = { ok: true; state: ServerState } | { ok: false; reason: 'codigo_invalido' | 'sin_red' };

/**
 * Teléfono perdido o nuevo: canjea el código, adopta la identidad recuperada (el teléfono anterior pierde el
 * acceso) y descarga todo lo guardado. Los cambios pendientes de este teléfono se descartan.
 */
export async function recoverAccount(code: string): Promise<RecoverResult> {
  const base = syncEndpoint();
  if (!base) return { ok: false, reason: 'sin_red' };
  const platform = /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad/i.test(navigator.userAgent) ? 'ios' : 'web';
  const res = await send(base, { method: 'POST', path: 'recuperar', body: { codigo: code.trim(), plataforma: platform } });
  const reply = res.json as { uuid_dispositivo?: string; token?: string } | null;
  if (res.outcome === 'drop') return { ok: false, reason: 'codigo_invalido' };
  if (res.outcome !== 'ok' || !reply?.token || !reply.uuid_dispositivo) return { ok: false, reason: 'sin_red' };
  const device = { uuid: reply.uuid_dispositivo, token: reply.token };
  const state = await send(base, { method: 'GET', path: 'estado' }, device.token);
  if (state.outcome !== 'ok' || !state.json) return { ok: false, reason: 'sin_red' };
  write(DEVICE_KEY, device);
  saveOutbox([]);
  return { ok: true, state: state.json as ServerState };
}

/**
 * Elimina la cuenta en el servidor (borrado lógico en cascada + supresión de datos personales; token y código
 * revocados) y olvida en el teléfono el token y los cambios pendientes, para que pueda volver a registrarse limpio.
 * 'sin_red': no se pudo contactar al servidor (no se borra nada para no dejar datos huérfanos).
 */
export async function deleteAccount(): Promise<'ok' | 'sin_red' | 'error'> {
  const base = syncEndpoint();
  const device = read<Device | null>(DEVICE_KEY, null);
  const forget = () => {
    write(DEVICE_KEY, null);
    saveOutbox([]);
  };
  // Sin servidor o sin registrar: no hay nada que borrar en el servidor.
  if (!base || !device) {
    forget();
    return 'ok';
  }
  const { outcome } = await send(base, { method: 'POST', path: 'eliminar_cuenta', body: {} }, device.token);
  // 401: la cuenta ya no existía o el token fue revocado; para el teléfono es igual que eliminada.
  if (outcome === 'ok' || outcome === 'unauthorized') {
    forget();
    return 'ok';
  }
  return outcome === 'retry' ? 'sin_red' : 'error';
}

/** Ayuda registrada para la alerta activa, o null (sin servidor, sin red o sin atención todavía). */
export async function fetchHelpStatus(): Promise<HelpStatus | null> {
  const base = syncEndpoint();
  const device = read<Device | null>(DEVICE_KEY, null);
  if (!base || !device || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/atencion`, { headers: { Authorization: `Bearer ${device.token}` }, signal: ctrl.signal });
    if (!res.ok) return null;
    return ((await res.json()) as { atencion: HelpStatus | null }).atencion;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Solo para pruebas. */
export function __resetSyncForTests(): void {
  memoryOutbox = null;
  getData = null;
  flushing = null;
}
