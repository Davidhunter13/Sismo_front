// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { flushPendingPhoto } from './photoService';
import { deviceToken, flush as flushSync, reRegisterDevice, syncEndpoint } from './syncService';

/**
 * Insignias de SISMO (contrato en el backend: Sismo::insignias).
 *
 *   GET  {VITE_SISMO_API_URL}/insignias                       → BadgesResponse
 *   POST {VITE_SISMO_API_URL}/insignias {acciones: [...≤50]}  → BadgesResponse (422 = acción inválida)
 *
 * Offline-first, igual que syncService: cada cosa que hace la persona se guarda en una COLA PERSISTENTE
 * (`sismo:v1:insignias_cola`) con su momento y se envía en lotes apenas hay token y red. Si el envío falla, la cola
 * se conserva. La última respuesta del servidor se guarda (`sismo:v1:insignias`) para mostrar las insignias sin red.
 * Las insignias «nuevas» que llegan en cualquier respuesta van a una cola de avisos (`sismo:v1:insignias_aviso`)
 * que muestra BadgeCelebration (nunca durante una alerta). Las alertas reales no registran nada aquí.
 */

export type BadgeLevel = 'bronce' | 'plata' | 'oro' | 'diamante' | 'especial';

interface BadgeBase {
  id: number | string;
  nivel: BadgeLevel;
  familia?: string;
  secreta?: boolean;
}

export interface EarnedBadge extends BadgeBase {
  nombre: string;
  descripcion: string;
  imagen: string;
  regla: string;
  obtenida: string;
  vence: string | null;
}

export interface PendingBadge extends BadgeBase {
  nombre: string;
  descripcion: string;
  imagen: string;
  regla: string;
  avance: number;
  requerido: number;
  hasta: string | null;
  dura_dias: number | null;
}

export interface SecretBadge extends BadgeBase {
  secreta: true;
  pista: string;
}

export interface ExpiredBadge extends BadgeBase {
  nombre: string;
  imagen: string;
  vencio: string;
  descripcion?: string;
  regla?: string;
}

/** Mismos 7 puntos que calcula el servidor (Sismo_insignias_model::perfil) y profileCompletion en el teléfono. */
export type ProfileItem = 'nombre' | 'foto' | 'contactos' | 'correo' | 'puntos' | 'ficha' | 'mochila';

export interface BadgesResponse {
  ganadas: EarnedBadge[];
  por_ganar: PendingBadge[];
  secretas: SecretBadge[];
  vencidas: ExpiredBadge[];
  nuevas: EarnedBadge[];
  perfil: { porcentaje: number; items: Record<ProfileItem, boolean> } | null;
  total: number;
}

/** Hechos que acepta el servidor (lista blanca en Sismo_insignias_reglas::HECHOS). */
export const BADGE_KEYS = [
  'registro_completo', 'ficha_medica', 'contacto_agregado', 'contacto_principal', 'punto_encuentro', 'mochila_item',
  'mochila_completa', 'mochila_revisada', 'foto_perfil', 'qr_medico', 'respaldo', 'simulacro', 'ver_brujula', 'ver_ruta',
  'ver_guia', 'ver_sismos', 'ver_estadisticas', 'ver_historial', 'cambiar_idioma', 'cambiar_tema', 'alto_contraste',
  'deteccion_caidas', 'ahorro_bateria', 'estoy_a_salvo', 'avisar_bien', 'encuesta_sus', 'post_sismo', 'mis_insignias',
] as const;
export type BadgeKey = (typeof BADGE_KEYS)[number];

export interface BadgeAction {
  /** Id local para quitarla de la cola tras enviarla (no se envía). */
  qid?: string;
  accion: 'ingreso' | 'hecho';
  clave?: BadgeKey;
  elemento?: string;
  valor?: number;
  momento: string;
}

const QUEUE_KEY = 'sismo:v1:insignias_cola';
const CACHE_KEY = 'sismo:v1:insignias';
const NOTICE_KEY = 'sismo:v1:insignias_aviso';
/** Ids de insignias ganadas que la persona aún no ha visto en Mis insignias (marca «Nueva»). */
const NEW_KEY = 'sismo:v1:insignias_nuevas';
const OPEN_KEY = 'sismo:v1:insignias_ingreso';
const RECENT_KEY = 'sismo:v1:insignias_recientes';

/** Máximo de acciones por solicitud (Sismo::MAX_ACCIONES_LOTE). */
export const BATCH_SIZE = 50;
/** El servidor rechaza acciones de hace más de 30 días: se descartan un poco antes para no perder el lote. */
const MAX_AGE_MS = 29.5 * 86_400_000;
/** Tope de la cola sin red (se descartan las más antiguas). */
const MAX_QUEUE = 500;
/** El servidor cuenta como máximo una vez por hora cada hecho: repetirlo antes solo gasta datos. */
const DEDUPE_MS = 3_600_000;
const TIMEOUT_MS = 10_000;
const RETRIES = 3;
const DEBOUNCE_MS = 1_500;

// ------------------------------------------------------------------ Dependencias (se reemplazan en las pruebas)

export interface BadgeDeps {
  base: () => string | null;
  token: () => string | null;
  /** Registra el teléfono (syncService) si aún no tiene token. */
  register: () => Promise<void>;
  /** Token rechazado (401): registrarse de nuevo. */
  reRegister: () => Promise<void>;
  online: () => boolean;
  now: () => number;
  wait: (ms: number) => Promise<void>;
}

const defaultDeps: BadgeDeps = {
  base: syncEndpoint,
  token: deviceToken,
  register: () => flushSync(),
  reRegister: reRegisterDevice,
  online: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  now: () => Date.now(),
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
};
let deps: BadgeDeps = defaultDeps;

// ------------------------------------------------------------------ Almacenamiento

/**
 * Copia EN MEMORIA de todo lo que se guarda (respuesta, cola, avisos). Es la fuente que lee la interfaz: si
 * localStorage falla al guardar (lleno: QuotaExceeded, modo privado…), la app sigue mostrando la respuesta nueva
 * y no la copia vieja que quedó en el almacenamiento. Bug real: se veían «Ganadas 2» aunque el servidor tenía 9.
 */
const memory = new Map<string, unknown>();
let quotaWarned = false;

function read<T>(key: string, fallback: T): T {
  if (memory.has(key)) {
    const v = memory.get(key);
    return v === null || v === undefined ? fallback : (v as T);
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  memory.set(key, value);
  try {
    // Se borra antes de escribir: si la escritura falla, no queda una copia vieja que alguien pueda leer.
    localStorage.removeItem(key);
    if (value !== null) localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (!quotaWarned) {
      quotaWarned = true;
      console.warn('[sismo-insignias] no se pudo guardar en el teléfono; se usa la copia en memoria', key, (e as Error)?.name);
    }
  }
}

const listeners = new Set<() => void>();
let version = 0;
/**
 * Avisa a la interfaz en la siguiente vuelta del ciclo de eventos (no en el mismo instante). useSyncExternalStore
 * dibuja de forma síncrona: si se registraba un hecho dentro de un manejador de Ionic (p. ej. «Finalizar» en el
 * diálogo de la alerta, que además navega), React desmontaba la pantalla a mitad del cierre del ion-alert y la app
 * fallaba con «removeChild … not a child». `version` cambia de inmediato, así que quien lea ya ve el dato nuevo.
 */
let emitTimer: ReturnType<typeof setTimeout> | null = null;
const emit = () => {
  version++;
  if (emitTimer) return;
  emitTimer = setTimeout(() => {
    emitTimer = null;
    listeners.forEach((l) => l());
  }, 0);
};

/** Suscripción para useSyncExternalStore (cambios en la cola, la copia guardada o los avisos). */
export function subscribeBadges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function badgesVersion(): number {
  return version;
}

export function loadQueue(): BadgeAction[] {
  const q = read<unknown>(QUEUE_KEY, []);
  return Array.isArray(q) ? (q as BadgeAction[]) : [];
}

function saveQueue(queue: BadgeAction[]): void {
  write(QUEUE_KEY, queue.length ? queue : null);
  emit();
}

/** Última respuesta del servidor guardada en el teléfono (para verlas sin red), o null. */
export function cachedBadges(): BadgesResponse | null {
  return read<BadgesResponse | null>(CACHE_KEY, null);
}

// ------------------------------------------------------------------ Cola de avisos «¡Ganaste una insignia!»

export function pendingNotices(): EarnedBadge[] {
  const n = read<unknown>(NOTICE_KEY, []);
  return Array.isArray(n) ? (n as EarnedBadge[]) : [];
}

/** Agrega insignias nuevas a los avisos (sin repetir las que ya esperan). */
export function enqueueNotices(badges: EarnedBadge[]): void {
  if (!badges?.length) return;
  const current = pendingNotices();
  const ids = new Set(current.map((b) => String(b.id)));
  const fresh = badges.filter((b) => !ids.has(String(b.id)));
  if (!fresh.length) return;
  write(NOTICE_KEY, [...current, ...fresh]);
  addNew(fresh.map((b) => b.id));
  emit();
}

// ------------------------------------------------------------------ Insignias «Nueva» (sin ver)

export function newBadgeIds(): string[] {
  const n = read<unknown>(NEW_KEY, []);
  return Array.isArray(n) ? n.map(String) : [];
}

function addNew(ids: EarnedBadge['id'][]): void {
  const set = new Set(newBadgeIds());
  ids.forEach((id) => set.add(String(id)));
  write(NEW_KEY, [...set]);
}

/**
 * «Ver mis insignias» (o la persona ya está en Mis insignias): se cierran TODOS los avisos en cola, sin mostrarlos
 * uno por uno, y quedan con la marca «Nueva» hasta que se vean en la lista.
 */
export function markAllNoticesAsNew(): void {
  const pending = pendingNotices();
  if (!pending.length) return;
  addNew(pending.map((b) => b.id));
  write(NOTICE_KEY, null);
  emit();
}

/** Ya se vieron en Mis insignias: se quita la marca «Nueva». */
export function markSeen(ids: EarnedBadge['id'][]): void {
  const quitar = new Set(ids.map(String));
  const actuales = newBadgeIds();
  const rest = actuales.filter((id) => !quitar.has(id));
  if (rest.length === actuales.length) return;
  write(NEW_KEY, rest.length ? rest : null);
  emit();
}

/** Quita el aviso ya mostrado. */
export function dismissNotice(id: EarnedBadge['id']): void {
  const rest = pendingNotices().filter((b) => String(b.id) !== String(id));
  write(NOTICE_KEY, rest.length ? rest : null);
  emit();
}

// ------------------------------------------------------------------ Registro de acciones

const localDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let timer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush(): void {
  if (!deps.base()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushBadges();
  }, DEBOUNCE_MS);
}

let seq = 0;
function enqueue(action: BadgeAction): void {
  const queue = [...loadQueue(), { qid: `${deps.now().toString(36)}-${(seq++).toString(36)}`, ...action }].slice(-MAX_QUEUE);
  saveQueue(queue);
  scheduleFlush();
}

/**
 * Registra un hecho de la app. `elemento` = lo que se cuenta como distinto (id del contacto, del punto, del
 * elemento de la mochila, de la tarjeta de la guía o del paso «Después del sismo»); `valor` = medida entera 0–600
 * (minutos del simulacro). Un mismo hecho (clave + elemento, sin valor) se guarda como máximo una vez por hora.
 * No hace nada sin servidor configurado.
 */
export function recordAction(clave: BadgeKey, opts: { elemento?: string; valor?: number } = {}): void {
  if (!deps.base() || !(BADGE_KEYS as readonly string[]).includes(clave)) return;
  const now = deps.now();
  const elemento = opts.elemento?.trim().slice(0, 80) || undefined;
  const valor = opts.valor === undefined || !Number.isFinite(opts.valor) ? undefined : Math.min(600, Math.max(0, Math.round(opts.valor)));
  if (valor === undefined) {
    const recent = read<Record<string, number>>(RECENT_KEY, {});
    const key = `${clave}|${elemento ?? ''}`;
    if (recent[key] && now - recent[key] < DEDUPE_MS) return;
    const pruned = Object.fromEntries(Object.entries(recent).filter(([, t]) => now - t < DEDUPE_MS));
    write(RECENT_KEY, { ...pruned, [key]: now });
  }
  enqueue({
    accion: 'hecho',
    clave,
    ...(elemento ? { elemento } : {}),
    ...(valor !== undefined ? { valor } : {}),
    momento: new Date(now).toISOString(),
  });
}

/** Minutos enteros del simulacro, redondeados hacia arriba (mínimo 1, máximo 600). */
export function drillMinutes(startMs: number, endMs: number): number {
  const minutes = Math.ceil(Math.max(0, endMs - startMs) / 60_000);
  return Math.min(600, Math.max(1, minutes));
}

/** Registra que se abrió la app (como máximo una vez por día, según la fecha del teléfono). */
export function recordOpen(): void {
  if (!deps.base()) return;
  const now = deps.now();
  const today = localDay(now);
  if (read<string | null>(OPEN_KEY, null) === today) return;
  write(OPEN_KEY, today);
  enqueue({ accion: 'ingreso', momento: new Date(now).toISOString() });
}

// ------------------------------------------------------------------ Red

type Result = { status: 'ok'; json: BadgesResponse } | { status: 'invalid' | 'retry' };

async function request(method: 'GET' | 'POST', body?: unknown): Promise<Result> {
  const base = deps.base();
  if (!base || !deps.online()) return { status: 'retry' };
  let token = deps.token();
  if (!token) {
    await deps.register().catch(() => undefined);
    token = deps.token();
    if (!token) return { status: 'retry' };
  }
  let reRegistered = false;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/insignias`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      if (res.ok) return { status: 'ok', json: normalize(await res.json()) };
      if (res.status === 422) return { status: 'invalid' };
      // 401: token revocado o base reiniciada. Se registra de nuevo una vez y se repite con el token nuevo
      // (antes se quedaba mostrando la copia guardada para siempre).
      if (res.status === 401 && !reRegistered) {
        reRegistered = true;
        await deps.reRegister().catch(() => undefined);
        const next = deps.token();
        if (!next || next === token) return { status: 'retry' };
        token = next;
        attempt--;
        continue;
      }
      // Otros 4xx: se conserva para el siguiente ciclo.
      if (res.status !== 429 && res.status < 500) return { status: 'retry' };
    } catch {
      if (!deps.online()) return { status: 'retry' };
    } finally {
      clearTimeout(t);
    }
    // 429 o 5xx: espera exponencial (1 s, 2 s, 4 s).
    if (attempt < RETRIES) await deps.wait(1000 * 2 ** attempt);
  }
  return { status: 'retry' };
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Respuesta con todas las listas presentes, aunque el servidor omita alguna. */
export function normalize(raw: unknown): BadgesResponse {
  const r = (raw ?? {}) as Partial<BadgesResponse>;
  return {
    ganadas: arr(r.ganadas),
    por_ganar: arr(r.por_ganar),
    secretas: arr(r.secretas),
    vencidas: arr(r.vencidas),
    nuevas: arr(r.nuevas),
    perfil: r.perfil && typeof r.perfil === 'object' ? r.perfil : null,
    total: typeof r.total === 'number' ? r.total : 0,
  };
}

/** Quita lo que pesa de la copia guardada (imágenes incrustadas como data URL). */
const slimImage = <T extends { imagen?: string }>(b: T): T =>
  typeof b.imagen === 'string' && b.imagen.startsWith('data:') && b.imagen.length > 2048 ? { ...b, imagen: '' } : b;

/**
 * Toda respuesta del servidor (GET o POST, misma forma) reemplaza la copia (en memoria primero y luego en el
 * teléfono); sus «nuevas» van a los avisos (el servidor las entrega una sola vez). Emite después de actualizar.
 */
function remember(json: BadgesResponse): void {
  enqueueNotices(json.nuevas);
  write(CACHE_KEY, {
    ...json,
    ganadas: json.ganadas.map(slimImage),
    por_ganar: json.por_ganar.map(slimImage),
    vencidas: json.vencidas.map(slimImage),
    nuevas: [],
  });
  emit();
}

let flushing: Promise<void> | null = null;

/** Envía la cola en lotes de 50. Se detiene en el primer fallo y conserva lo pendiente. */
export function flushBadges(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    // Las demasiado antiguas las rechazaría el servidor (y con ellas todo el lote).
    const minTime = deps.now() - MAX_AGE_MS;
    const fresh = loadQueue().filter((a) => new Date(a.momento).getTime() >= minTime);
    if (fresh.length !== loadQueue().length) saveQueue(fresh);
    while (loadQueue().length > 0) {
      const batch = loadQueue().slice(0, BATCH_SIZE);
      const acciones = batch.map((a) => {
        const copy = { ...a };
        delete copy.qid;
        return copy;
      });
      const result = await request('POST', { acciones });
      if (result.status === 'retry') return;
      if (result.status === 'ok') remember(result.json);
      else console.warn('[sismo-insignias] lote rechazado por el servidor', batch.length);
      // Se quitan las enviadas (las que llegaron mientras tanto quedan en la cola).
      const sent = new Set(batch.map((a) => a.qid));
      saveQueue(loadQueue().filter((a) => !sent.has(a.qid)));
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

export type FetchBadgesResult = { data: BadgesResponse | null; fromCache: boolean };

/** Sube lo pendiente y descarga las insignias. Sin red o con error devuelve la última copia guardada. */
let fetching: Promise<FetchBadgesResult> | null = null;

/**
 * Sube lo pendiente y SIEMPRE pide al servidor la versión actual (GET), que reemplaza la copia guardada. La copia
 * solo se devuelve sin red o si el servidor no respondió. Las llamadas simultáneas comparten la misma solicitud.
 */
export function fetchBadges(): Promise<FetchBadgesResult> {
  if (!deps.base()) return Promise.resolve({ data: cachedBadges(), fromCache: true });
  if (fetching) return fetching;
  fetching = (async (): Promise<FetchBadgesResult> => {
    await flushBadges();
    const result = await request('GET');
    if (result.status === 'ok') {
      remember(result.json);
      return { data: result.json, fromCache: false };
    }
    return { data: cachedBadges(), fromCache: true };
  })().finally(() => {
    fetching = null;
  });
  return fetching;
}

/** Arranca: registra el ingreso del día, envía lo pendiente y reintenta al volver la red o el primer plano. */
export function startBadges(): () => void {
  if (!deps.base()) return () => undefined;
  // La foto de perfil pendiente (elegida sin internet) se sube en los mismos momentos que la cola de insignias.
  const run = () => {
    void flushBadges();
    void flushPendingPhoto();
  };
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    recordOpen();
    run();
  };
  window.addEventListener('online', run);
  document.addEventListener('visibilitychange', onVisible);
  recordOpen();
  void fetchBadges();
  void flushPendingPhoto();
  return () => {
    window.removeEventListener('online', run);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/** Olvida todo lo de insignias en el teléfono (tras eliminar la cuenta). */
export function forgetBadges(): void {
  for (const k of [QUEUE_KEY, CACHE_KEY, NOTICE_KEY, NEW_KEY, OPEN_KEY, RECENT_KEY]) write(k, null);
  emit();
}

// ------------------------------------------------------------------ Selección para la interfaz

/** Última insignia ganada (por fecha). */
export function latestEarned(data: BadgesResponse | null): EarnedBadge | null {
  const list = [...(data?.ganadas ?? [])];
  list.sort((a, b) => new Date(b.obtenida).getTime() - new Date(a.obtenida).getTime());
  return list[0] ?? null;
}

/** La insignia por ganar con más avance relativo. */
export function closestPending(data: BadgesResponse | null): PendingBadge | null {
  const ratio = (b: PendingBadge) => (b.requerido > 0 ? b.avance / b.requerido : 0);
  const list = [...(data?.por_ganar ?? [])].filter((b) => b.avance < b.requerido || b.requerido === 0);
  list.sort((a, b) => ratio(b) - ratio(a));
  return list[0] ?? null;
}

/** Solo para pruebas. */
export function __setBadgeDepsForTests(patch: Partial<BadgeDeps> | null): void {
  deps = patch ? { ...defaultDeps, ...patch } : defaultDeps;
  flushing = null;
  fetching = null;
  memory.clear();
  quotaWarned = false;
  if (timer) clearTimeout(timer);
  timer = null;
}
