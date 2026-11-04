// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useSyncExternalStore } from 'react';
import { fillTokens, setEmergencyNumber, type Lang } from '../i18n';
import { messages } from '../i18n/messages';

/**
 * Catálogos editables desde el panel administrativo (backend CodeIgniter 3, `GET /catalogos`):
 * tipos de evento, parentescos, ítems sugeridos del kit, pasos «Después del sismo», tipos de sangre,
 * guía de emergencia y parámetros generales (número de emergencia, topes y tiempos).
 *
 * Funcionan sin internet: la app trae estos valores por defecto (los mismos con los que se siembra la base de
 * datos), descarga los del servidor al abrir con red y guarda la última copia en el teléfono (`sismo:v1:catalogos`).
 * El SOS nunca depende del servidor.
 */

export type Moment = 'antes' | 'durante' | 'despues';
export const MOMENTS: Moment[] = ['antes', 'durante', 'despues'];

export interface L10n {
  es: string;
  en: string;
}

export interface CatalogItem {
  /** Clave estable: es lo que se guarda en los datos (nunca el texto visible). */
  id: string;
  label: L10n;
  /** Nombre de ícono (ver components/catalogIcons.ts). */
  icon?: string;
}

export interface GuideCard {
  id: string;
  moment: Moment;
  title: L10n;
  steps: { es: string[]; en: string[] };
  icon: string;
}

export interface CatalogParams {
  emergencyNumber: string;
  maxMeetingPoints: number;
  lowBatteryOptions: number[];
  drillDelayMinS: number;
  drillDelayMaxS: number;
  alertLocationRefreshMin: number;
}

export interface Catalogs {
  version: string;
  eventTypes: CatalogItem[];
  relationships: CatalogItem[];
  kitItems: CatalogItem[];
  postQuakeSteps: CatalogItem[];
  bloodTypes: CatalogItem[];
  guide: { intro: Record<Moment, L10n>; disclaimer: L10n; cards: GuideCard[] };
  params: CatalogParams;
}

const STORAGE_KEY = 'sismo:v1:catalogos';
const TIMEOUT_MS = 10_000;

/** Claves que la app usa en su lógica (widget, detección de caídas): se pueden renombrar, no desactivar. */
export const RESERVED_EVENT_TYPES = ['sismo', 'emergencia_general'];
/** Valor guardado de «No sé» en el tipo de sangre (histórico). */
export const BLOOD_UNKNOWN = 'No sé';

const pad = (n: number) => String(n).padStart(2, '0');
const pair = (es: string[], en: string[], prefix: string): CatalogItem[] =>
  es.map((label, i) => ({ id: `${prefix}_${pad(i + 1)}`, label: { es: label, en: en[i] ?? label } }));

const GUIDE_ICONS: Record<Moment, string[]> = {
  antes: ['clipboard-list', 'backpack', 'wrench'],
  durante: ['shield-alert', 'building', 'trees', 'car'],
  despues: ['door-open', 'home', 'heart-handshake', 'message'],
};

/** Valores por defecto: salen de los textos de la app (es/en). También se usan para sembrar la base de datos. */
export function defaultCatalogs(): Catalogs {
  const es = messages;
  const ev = (k: 'sismo' | 'emergencia_general' | 'prueba') => ({ es: es.labels.es.eventType[k], en: es.labels.en.eventType[k] });
  const rel = es.contacts.es.relationships;
  const relEn = es.contacts.en.relationships;
  const g = es.guide.es;
  const gEn = es.guide.en;
  return {
    version: 'local',
    eventTypes: [
      { id: 'sismo', label: ev('sismo'), icon: 'activity' },
      { id: 'emergencia_general', label: ev('emergencia_general'), icon: 'alert-octagon' },
      { id: 'prueba', label: ev('prueba'), icon: 'flask' },
    ],
    relationships: Object.keys(rel).map((id) => ({ id, label: { es: rel[id], en: relEn[id] ?? rel[id] } })),
    kitItems: pair(es.services.es.kit.defaultItems, es.services.en.kit.defaultItems, 'kit'),
    postQuakeSteps: pair(es.features.es.postQuake.steps, es.features.en.postQuake.steps, 'paso'),
    bloodTypes: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((id) => ({ id, label: { es: id, en: id } }))
      .concat([{ id: BLOOD_UNKNOWN, label: { es: es.medical.es.bloodUnknown, en: es.medical.en.bloodUnknown } }]),
    guide: {
      intro: Object.fromEntries(MOMENTS.map((m) => [m, { es: g.sections[m].intro, en: gEn.sections[m].intro }])) as Record<Moment, L10n>,
      disclaimer: {
        es: `${g.disclaimerPre}${g.disclaimerStrong}${g.disclaimerPost}`,
        en: `${gEn.disclaimerPre}${gEn.disclaimerStrong}${gEn.disclaimerPost}`,
      },
      cards: MOMENTS.flatMap((m) => g.sections[m].cards.map((c, i): GuideCard => ({
        id: `${m}_${i + 1}`,
        moment: m,
        title: { es: c.title, en: gEn.sections[m].cards[i]?.title ?? c.title },
        steps: { es: c.steps, en: gEn.sections[m].cards[i]?.steps ?? c.steps },
        icon: GUIDE_ICONS[m][i] ?? 'clipboard-list',
      }))),
    },
    params: { emergencyNumber: '123', maxMeetingPoints: 5, lowBatteryOptions: [0, 10, 15, 20, 30], drillDelayMinS: 3, drillDelayMaxS: 10, alertLocationRefreshMin: 2 },
  };
}

// ------------------------------------------------------------------ Validación de lo que llega del servidor

const isStr = (v: unknown): v is string => typeof v === 'string';
function l10n(v: unknown): L10n | null {
  const o = v as Partial<L10n> | null;
  if (!o || !isStr(o.es) || !o.es.trim()) return null;
  return { es: o.es, en: isStr(o.en) && o.en.trim() ? o.en : o.es };
}
function items(v: unknown, fallback: CatalogItem[]): CatalogItem[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.flatMap((x): CatalogItem[] => {
    const o = x as { id?: unknown; label?: unknown; icon?: unknown };
    const label = l10n(o?.label);
    return isStr(o?.id) && o.id && label ? [{ id: o.id, label, icon: isStr(o.icon) ? o.icon : undefined }] : [];
  });
  return out.length ? out : fallback;
}
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fallback;

/** Convierte la respuesta del servidor (o la copia guardada) en catálogos válidos; lo que falte usa los valores por defecto. */
export function parseCatalogs(raw: unknown): Catalogs | null {
  const r = raw as Partial<Record<keyof Catalogs, unknown>> | null;
  if (!r || typeof r !== 'object' || !isStr(r.version)) return null;
  const d = defaultCatalogs();
  const p = (r.params ?? {}) as Partial<Record<keyof CatalogParams, unknown>>;
  const gRaw = (r.guide ?? {}) as { intro?: Record<string, unknown>; disclaimer?: unknown; cards?: unknown };
  const cards = Array.isArray(gRaw.cards)
    ? gRaw.cards.flatMap((x): GuideCard[] => {
      const c = x as { id?: unknown; moment?: unknown; title?: unknown; steps?: { es?: unknown; en?: unknown }; icon?: unknown };
      const title = l10n(c?.title);
      const stepsEs = Array.isArray(c?.steps?.es) ? c.steps.es.filter(isStr) : [];
      const stepsEn = Array.isArray(c?.steps?.en) ? c.steps.en.filter(isStr) : [];
      if (!isStr(c?.id) || !MOMENTS.includes(c.moment as Moment) || !title || stepsEs.length === 0) return [];
      return [{ id: c.id, moment: c.moment as Moment, title, steps: { es: stepsEs, en: stepsEn.length ? stepsEn : stepsEs }, icon: isStr(c.icon) ? c.icon : 'clipboard-list' }];
    })
    : [];
  const options = Array.isArray(p.lowBatteryOptions)
    ? p.lowBatteryOptions.filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 100)
    : [];
  const min = num(p.drillDelayMinS, d.params.drillDelayMinS, 0, 600);
  return {
    version: r.version,
    eventTypes: items(r.eventTypes, d.eventTypes),
    relationships: items(r.relationships, d.relationships),
    kitItems: items(r.kitItems, d.kitItems),
    postQuakeSteps: items(r.postQuakeSteps, d.postQuakeSteps),
    bloodTypes: items(r.bloodTypes, d.bloodTypes),
    guide: {
      intro: Object.fromEntries(MOMENTS.map((m) => [m, l10n(gRaw.intro?.[m]) ?? d.guide.intro[m]])) as Record<Moment, L10n>,
      disclaimer: l10n(gRaw.disclaimer) ?? d.guide.disclaimer,
      cards: cards.length ? cards : d.guide.cards,
    },
    params: {
      emergencyNumber: isStr(p.emergencyNumber) && /^[0-9+#*]{2,15}$/.test(p.emergencyNumber) ? p.emergencyNumber : d.params.emergencyNumber,
      maxMeetingPoints: num(p.maxMeetingPoints, d.params.maxMeetingPoints, 1, 20),
      lowBatteryOptions: options.length ? options : d.params.lowBatteryOptions,
      drillDelayMinS: min,
      drillDelayMaxS: Math.max(min, num(p.drillDelayMaxS, d.params.drillDelayMaxS, 0, 600)),
      alertLocationRefreshMin: num(p.alertLocationRefreshMin, d.params.alertLocationRefreshMin, 1, 60),
    },
  };
}

// ------------------------------------------------------------------ Estado (copia local + suscripción)

function loadStored(): Catalogs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseCatalogs(JSON.parse(raw)) ?? defaultCatalogs();
  } catch {
    // Sin almacenamiento o copia dañada: valores por defecto.
  }
  return defaultCatalogs();
}

let current: Catalogs | null = null;
const listeners = new Set<() => void>();

export function getCatalogs(): Catalogs {
  if (!current) {
    current = loadStored();
    setEmergencyNumber(current.params.emergencyNumber);
  }
  return current;
}

function setCatalogs(next: Catalogs): void {
  current = next;
  setEmergencyNumber(next.params.emergencyNumber);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Se mantiene en memoria.
  }
  listeners.forEach((l) => l());
}

/** Hook: catálogos actuales; el componente se vuelve a dibujar cuando llegan nuevos del servidor. */
export function useCatalogs(): Catalogs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getCatalogs,
    getCatalogs,
  );
}

/** Descarga los catálogos del servidor (sin token: son públicos). Nunca lanza; sin red conserva la copia local. */
export async function refreshCatalogs(): Promise<boolean> {
  const base = (import.meta.env.VITE_SISMO_API_URL as string | undefined)?.trim().replace(/\/+$/, '');
  if (!base || (typeof navigator !== 'undefined' && navigator.onLine === false)) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/catalogos`, { signal: ctrl.signal });
    if (!res.ok) return false;
    const parsed = parseCatalogs(await res.json());
    if (!parsed) return false;
    if (parsed.version !== getCatalogs().version) setCatalogs(parsed);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let firstRefresh: Promise<boolean> | null = null;
/** Primera descarga al abrir la app (una sola vez; la comparten el estado y la pantalla de carga). */
export function ensureFirstRefresh(): Promise<boolean> {
  if (!firstRefresh) firstRefresh = refreshCatalogs();
  return firstRefresh;
}

// ------------------------------------------------------------------ Ayudas de lectura

/** Texto en el idioma pedido (con el número de emergencia aplicado). */
export function text(l: L10n, lang: Lang): string {
  return fillTokens(lang === 'en' ? l.en || l.es : l.es);
}

/** Etiqueta de un valor guardado; si ya no existe en el catálogo, se muestra el valor tal cual. */
export function labelOf(list: CatalogItem[], id: string, lang: Lang): string {
  const item = list.find((x) => x.id === id);
  return item ? text(item.label, lang) : id;
}

/** Ícono configurado para un valor guardado (o undefined). */
export function iconOf(list: CatalogItem[], id: string): string | undefined {
  return list.find((x) => x.id === id)?.icon;
}

/**
 * Normaliza el avance de «Después del sismo»: las versiones anteriores lo guardaban por posición (números);
 * ahora se guarda por clave estable del paso. Los números se traducen a las claves por defecto (paso_01…).
 */
export function normalizePostQuake(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = value.flatMap((v): string[] => {
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 99) return [`paso_${pad(v + 1)}`];
    if (typeof v === 'string' && v) return [v];
    return [];
  });
  return [...new Set(out)];
}

/** Solo para pruebas. */
export function __resetCatalogsForTests(): void {
  current = null;
  firstRefresh = null;
  listeners.clear();
}
