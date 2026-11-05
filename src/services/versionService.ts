// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { DEMO_ENABLED } from '../utils/env';
import { syncEndpoint } from './syncService';

/**
 * Aviso de actualización de la app Android.
 *
 *   GET {VITE_SISMO_API_URL}/version  (público) → { actual, minima, nombre, enlace, tienda }
 *
 * La app compara su versionCode (android/app/build.gradle, inyectado por vite.config.ts):
 *   - menor que «minima» → actualización obligatoria (pantalla que no deja seguir, salvo la emergencia);
 *   - menor que «actual» → aviso «Hay una versión nueva» que se puede cerrar (no vuelve a salir para esa versión);
 *   - si no, nada.
 * «enlace» es la tienda si el administrador la configuró; si no, la descarga del APK.
 * Solo aplica en la app Android: la versión web siempre es la última. Sin internet se usa la última respuesta
 * guardada, para que la versión mínima se respete también sin conexión.
 */
export interface PublishedVersion {
  actual: number;
  minima: number;
  nombre: string;
  enlace: string;
  tienda: boolean;
}

export type UpdateLevel = 'ok' | 'sugerida' | 'obligatoria';

export interface UpdateState {
  level: UpdateLevel;
  version: PublishedVersion | null;
}

const CACHE_KEY = 'sismo:v1:version_app';
const SKIP_KEY = 'sismo:v1:version_omitida';
/** Solo pruebas (compilaciones con demo): simula la app Android con este versionCode. */
export const TEST_CODE_KEY = 'sismo:v1:version_codigo_pruebas';
const TIMEOUT_MS = 8000;

/** Decide el tipo de aviso. Función pura (versionService.test.ts). */
export function evaluateVersion(myCode: number, v: PublishedVersion | null, skipped: number | null = null): UpdateLevel {
  if (!v || !Number.isFinite(myCode) || myCode < 1) return 'ok';
  if (v.minima > 0 && myCode < v.minima) return 'obligatoria';
  if (v.actual > 0 && myCode < v.actual && skipped !== v.actual) return 'sugerida';
  return 'ok';
}

/** Valida la respuesta del servidor; null si no tiene la forma esperada o el enlace no es http(s). */
export function parseVersion(x: unknown): PublishedVersion | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const actual = Number(o.actual);
  const minima = Number(o.minima);
  const enlace = typeof o.enlace === 'string' ? o.enlace : '';
  if (!Number.isInteger(actual) || !Number.isInteger(minima) || !/^https?:\/\//i.test(enlace)) return null;
  return { actual, minima, nombre: typeof o.nombre === 'string' ? o.nombre.slice(0, 20) : '', enlace, tienda: o.tienda === true };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: el aviso vuelve a salir, no es grave */
  }
}

/** versionCode de esta app, o 0 si no es la app Android (en la web no hay aviso). */
export function myVersionCode(): number {
  if (DEMO_ENABLED) {
    const prueba = Number(read(TEST_CODE_KEY));
    if (prueba > 0) return prueba;
  }
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return 0;
  return Number(import.meta.env.VITE_APP_VERSION_CODE ?? 0);
}

export function myVersionName(): string {
  return String(import.meta.env.VITE_APP_VERSION_NAME ?? '');
}

function cached(): PublishedVersion | null {
  try {
    return parseVersion(JSON.parse(read(CACHE_KEY) ?? 'null'));
  } catch {
    return null;
  }
}

function skipped(): number | null {
  const n = Number(read(SKIP_KEY));
  return n > 0 ? n : null;
}

/** Consulta la versión publicada (con la última guardada si no hay red) y decide el aviso. */
export async function checkForUpdate(): Promise<UpdateState> {
  const code = myVersionCode();
  if (code < 1) return { level: 'ok', version: null };
  let version = cached();
  const base = syncEndpoint();
  if (base) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`${base}/version`, { signal: ctrl.signal, cache: 'no-store' });
      const fresh = r.ok ? parseVersion(await r.json()) : null;
      if (fresh) {
        version = fresh;
        write(CACHE_KEY, JSON.stringify(fresh));
      }
    } catch {
      /* sin red: se usa la última guardada */
    } finally {
      clearTimeout(timer);
    }
  }
  return { level: evaluateVersion(code, version, skipped()), version };
}

/** «Ahora no»: no vuelve a avisar de esta versión (sí de una más nueva o si pasa a ser obligatoria). */
export function skipVersion(actual: number): void {
  write(SKIP_KEY, String(actual));
}

/** Abre el enlace de actualización: en Android lo recibe el sistema (tienda o navegador que descarga el APK). */
export function openUpdateLink(v: PublishedVersion): void {
  if (Capacitor.isNativePlatform()) window.location.href = v.enlace;
  else window.open(v.enlace, '_blank', 'noopener');
}
