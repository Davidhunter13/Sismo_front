// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { deviceToken, flush as flushSync, syncEndpoint } from './syncService';

/**
 * Foto de perfil (contrato en el backend: Sismo::foto).
 *
 *   GET    {API}/foto                      → {foto: {url, expira} | null}
 *   POST   {API}/foto {imagen: data URL}    → igual; errores 413, 422 (imagen), 503 (bucket_no_disponible)
 *   DELETE {API}/foto                      → {foto: null}
 *
 * La URL es FIRMADA y vence (`expira`): nunca se guarda como permanente. Solo se guarda en memoria con su
 * vencimiento y se pide una nueva antes de que venza (o al fallar la imagen). En el teléfono solo se recuerda
 * si hay foto o no (`sismo:v1:foto`), para calcular «Perfil completado» sin red.
 */

export interface SignedPhoto {
  url: string;
  expira: string;
}

export type PhotoError = 'sin_servidor' | 'sin_red' | 'muy_grande' | 'invalida' | 'bucket' | 'servidor' | 'error';
/** `pending`: no se pudo enviar ahora y quedó en cola (se envía sola al volver la conexión). */
export type PhotoResult = { ok: true; photo: SignedPhoto | null; pending?: boolean } | { ok: false; error: PhotoError };

const HAS_KEY = 'sismo:v1:foto';
/** Se pide una URL nueva cuando falta menos que esto para que venza. */
export const REFRESH_MARGIN_MS = 60_000;
/** Tamaño máximo del archivo elegido (antes de reducirlo). */
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Lado mayor y calidad JPEG con que se sube. */
export const MAX_SIDE_PX = 512;
export const JPEG_QUALITY = 0.85;
const TIMEOUT_MS = 20_000;

export interface PhotoDeps {
  base: () => string | null;
  token: () => string | null;
  register: () => Promise<void>;
  online: () => boolean;
  now: () => number;
}

const defaultDeps: PhotoDeps = {
  base: syncEndpoint,
  token: deviceToken,
  register: () => flushSync(),
  online: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  now: () => Date.now(),
};
let deps: PhotoDeps = defaultDeps;

// ------------------------------------------------------------------ Estado (en memoria)

let cached: SignedPhoto | null = null;
let loaded = false;
const listeners = new Set<() => void>();
let snapshot = 0;
const emit = () => {
  snapshot++;
  listeners.forEach((l) => l());
};

export function subscribePhoto(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function photoSnapshot(): number {
  return snapshot;
}

/** Foto en memoria con su vencimiento (o null). */
export function currentPhoto(): SignedPhoto | null {
  return cached;
}

// ------------------------------------------------------------------ Almacenamiento (memoria primero)

/**
 * Copia en memoria de lo guardado: si localStorage está lleno (la foto pendiente pesa unas decenas de KB), la
 * intención sigue viva mientras la app esté abierta y la interfaz nunca lee una copia vieja.
 */
const memory = new Map<string, string | null>();

function readKey(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string | null): void {
  memory.set(key, value);
  try {
    localStorage.removeItem(key);
    if (value !== null) localStorage.setItem(key, value);
  } catch {
    // Lleno o sin almacenamiento: queda la copia en memoria.
  }
}

// ------------------------------------------------------------------ Foto pendiente (sin conexión)

/**
 * UNA sola intención pendiente (la última gana): subir la foto ya reducida (data URL JPEG ≤512 px; es una copia
 * local, no una URL firmada) o quitar la del servidor. Se guarda cuando no hay red o el servidor falla (red, 5xx,
 * 503 bucket_no_disponible) y se envía al volver la conexión (flushPendingPhoto, junto con las insignias).
 */
export type PendingPhoto = { op: 'upload'; dataUrl: string; at: string } | { op: 'delete'; at: string };
const PENDING_KEY = 'sismo:v1:foto_pendiente';
/** El servidor rechazó la foto pendiente (422): se avisa la próxima vez que se abra Configuración. */
const REJECTED_KEY = 'sismo:v1:foto_rechazada';

export function pendingPhoto(): PendingPhoto | null {
  try {
    const raw = readKey(PENDING_KEY);
    const p = raw ? (JSON.parse(raw) as PendingPhoto) : null;
    return p && (p.op === 'delete' || (p.op === 'upload' && typeof p.dataUrl === 'string')) ? p : null;
  } catch {
    return null;
  }
}

function setPending(p: PendingPhoto | null): void {
  writeKey(PENDING_KEY, p ? JSON.stringify(p) : null);
  emit();
}

/** true (una sola vez) si el servidor rechazó la foto pendiente; Configuración lo usa para avisar. */
export function takeRejectedPhoto(): boolean {
  const rejected = readKey(REJECTED_KEY) === '1';
  if (rejected) writeKey(REJECTED_KEY, null);
  return rejected;
}

/** Errores con los que la intención queda pendiente para reintentar después. */
const RETRYABLE: PhotoError[] = ['sin_red', 'servidor', 'bucket'];

/** URL a mostrar: la foto pendiente de subir (local) o la firmada vigente; null si no hay o se va a quitar. */
export function currentPhotoUrl(): string | null {
  const p = pendingPhoto();
  if (p) return p.op === 'upload' ? p.dataUrl : null;
  return cached && !isExpired(cached, deps.now(), 0) ? cached.url : null;
}

/** ¿Tiene foto? Cuenta la pendiente de subir; una pendiente de quitar cuenta como sin foto. */
export function hasPhoto(): boolean {
  const p = pendingPhoto();
  if (p) return p.op === 'upload';
  return serverHasPhoto();
}

/** Si el servidor tiene foto, según su última respuesta (se guarda solo el sí/no, nunca la URL). */
function serverHasPhoto(): boolean {
  return readKey(HAS_KEY) === '1';
}

function setHas(value: boolean): void {
  writeKey(HAS_KEY, value ? '1' : null);
}

/** ¿La URL firmada vence dentro de `margin` ms (o ya venció)? Fecha ilegible = vencida. */
export function isExpired(photo: SignedPhoto, now: number, margin = REFRESH_MARGIN_MS): boolean {
  const t = new Date(photo.expira).getTime();
  return !Number.isFinite(t) || t - margin <= now;
}

function adopt(photo: SignedPhoto | null): void {
  cached = photo && typeof photo.url === 'string' && photo.url ? photo : null;
  loaded = true;
  setHas(cached !== null);
  emit();
}

// ------------------------------------------------------------------ Red

async function call(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<PhotoResult> {
  const base = deps.base();
  if (!base) return { ok: false, error: 'sin_servidor' };
  if (!deps.online()) return { ok: false, error: 'sin_red' };
  let token = deps.token();
  if (!token) {
    await deps.register().catch(() => undefined);
    token = deps.token();
    if (!token) return { ok: false, error: 'sin_red' };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/foto`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as { foto?: SignedPhoto | null } | null;
      return { ok: true, photo: json?.foto ?? null };
    }
    if (res.status === 413) return { ok: false, error: 'muy_grande' };
    if (res.status === 422) return { ok: false, error: 'invalida' };
    if (res.status === 503) return { ok: false, error: 'bucket' };
    if (res.status >= 500 || res.status === 429) return { ok: false, error: 'servidor' };
    return { ok: false, error: 'error' };
  } catch {
    // Error de red o tiempo agotado.
    return { ok: false, error: 'sin_red' };
  } finally {
    clearTimeout(timer);
  }
}

let inflight: Promise<SignedPhoto | null> | null = null;

/**
 * URL firmada vigente: la de memoria si aún no está por vencer; si no, pide una nueva (GET /foto).
 * `force` la pide aunque parezca vigente (p. ej. la imagen falló al cargar). Sin red devuelve null.
 */
export function getPhoto(force = false): Promise<SignedPhoto | null> {
  if (!force && loaded && (!cached || !isExpired(cached, deps.now()))) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = call('GET')
    .then((r) => {
      if (r.ok) adopt(r.photo);
      return r.ok ? r.photo : cached && !isExpired(cached, deps.now(), 0) ? cached : null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Sube la foto ya reducida (data URL JPEG). Sin red o si el servidor falla (red, 5xx, bucket) queda PENDIENTE
 * (`pending: true`): se muestra de inmediato y se sube sola al volver la conexión.
 */
export async function uploadPhoto(dataUrl: string): Promise<PhotoResult> {
  const r = await call('POST', { imagen: dataUrl });
  if (r.ok) {
    setPending(null);
    adopt(r.photo);
    return r;
  }
  if (RETRYABLE.includes(r.error)) {
    setPending({ op: 'upload', dataUrl, at: new Date(deps.now()).toISOString() });
    return { ok: true, photo: null, pending: true };
  }
  return r;
}

/**
 * Quita la foto. Si había una pendiente de subir se descarta; si además el servidor tiene foto se pide quitarla,
 * y sin conexión queda pendiente el borrado (la última intención gana).
 */
export async function deletePhoto(): Promise<PhotoResult> {
  if (pendingPhoto()?.op === 'upload') setPending(null);
  if (!serverHasPhoto() && !cached) return { ok: true, photo: null };
  const r = await call('DELETE');
  if (r.ok) {
    setPending(null);
    adopt(null);
    return r;
  }
  if (RETRYABLE.includes(r.error)) {
    setPending({ op: 'delete', at: new Date(deps.now()).toISOString() });
    return { ok: true, photo: null, pending: true };
  }
  return r;
}

let flushingPhoto: Promise<void> | null = null;

/** Envía la intención pendiente (subir o quitar). Se llama al abrir la app, al volver la red y al volver a ella. */
export function flushPendingPhoto(): Promise<void> {
  if (flushingPhoto) return flushingPhoto;
  const p = pendingPhoto();
  if (!p || !deps.base() || !deps.online()) return Promise.resolve();
  flushingPhoto = (async () => {
    const r = p.op === 'upload' ? await call('POST', { imagen: p.dataUrl }) : await call('DELETE');
    // Si mientras tanto cambió la intención (otra foto o «Quitar»), no se toca la nueva.
    const still = JSON.stringify(pendingPhoto()) === JSON.stringify(p);
    if (r.ok) {
      if (still) setPending(null);
      adopt(r.photo);
      return;
    }
    if (!RETRYABLE.includes(r.error) && still) {
      // 422 imagen (o 413): reintentarla no sirve. Se descarta y se avisa al abrir Configuración.
      setPending(null);
      if (p.op === 'upload') writeKey(REJECTED_KEY, '1');
    }
  })().finally(() => {
    flushingPhoto = null;
  });
  return flushingPhoto;
}

/** Olvida la foto en el teléfono (p. ej. al eliminar la cuenta). */
export function forgetPhoto(): void {
  cached = null;
  loaded = false;
  setHas(false);
  writeKey(PENDING_KEY, null);
  writeKey(REJECTED_KEY, null);
  emit();
}

// ------------------------------------------------------------------ Validación y reducción (navegador)

/** Valida el archivo elegido antes de procesarlo: debe ser una imagen de hasta 8 MB. */
export function validatePhotoFile(file: { type: string; size: number }): 'ok' | 'tipo' | 'tamano' {
  if (!file.type || !file.type.startsWith('image/')) return 'tipo';
  if (file.size > MAX_FILE_BYTES) return 'tamano';
  return 'ok';
}

/** Medidas para que el lado mayor no pase de `max` (sin agrandar). */
export function fitWithin(width: number, height: number, max = MAX_SIDE_PX): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height, 1));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Reduce la imagen con un canvas a ≤512 px y la devuelve como data URL JPEG (calidad ~0.85). */
export async function resizeImage(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('imagen'));
      el.src = url;
    });
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    // Fondo blanco: las PNG con transparencia no quedan negras en JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Solo para pruebas. */
export function __setPhotoDepsForTests(patch: Partial<PhotoDeps> | null): void {
  deps = patch ? { ...defaultDeps, ...patch } : defaultDeps;
  cached = null;
  loaded = false;
  inflight = null;
  flushingPhoto = null;
  memory.clear();
}
