// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { messages, type Messages } from './messages';

/**
 * Internacionalización sin dependencias.
 * - Cada pantalla o servicio tiene su espacio de nombres en src/i18n/ns/<nombre>.ts con `es` y `en`.
 *   `en` se declara con el tipo de `es`, así TypeScript avisa si falta una traducción.
 * - Componentes: `const t = useT()` (src/i18n/useT.ts) → `t.home.title`.
 * - Servicios (fuera de React): `getT()`; el idioma activo lo fija AppStateProvider con `setLang`.
 */
export type Lang = 'es' | 'en';
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

let current: Lang = 'es';
const cache: Partial<Record<Lang, Messages>> = {};

export function setLang(lang: Lang): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export function getLang(): Lang {
  return current;
}

/** Configuración regional para fechas y números. */
export function getLocale(lang: Lang = current): string {
  return lang === 'en' ? 'en-US' : 'es-CO';
}

/**
 * Número de emergencia configurable (lo fija el catálogo descargado del servidor). Los textos lo llevan como
 * `{emergencyNumber}` y se reemplaza al construir los textos del idioma.
 */
let emergencyNumber = '123';

export function setEmergencyNumber(value: string): void {
  const next = value.trim();
  if (!next || next === emergencyNumber) return;
  emergencyNumber = next;
  for (const key of Object.keys(cache) as Lang[]) delete cache[key];
}

export function getEmergencyNumber(): string {
  return emergencyNumber;
}

/** Reemplaza los marcadores (`{emergencyNumber}`) de un texto. */
export function fillTokens(text: string): string {
  return text.split('{emergencyNumber}').join(emergencyNumber);
}

/** Aplica fillTokens a todos los textos (también a los que devuelven las funciones de traducción). */
function withTokens<T>(value: T): T {
  if (typeof value === 'string') return fillTokens(value) as T;
  if (typeof value === 'function') {
    const fn = value as unknown as (...args: unknown[]) => unknown;
    return ((...args: unknown[]) => withTokens(fn(...args))) as T;
  }
  if (Array.isArray(value)) return value.map(withTokens) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withTokens(v)])) as T;
  }
  return value;
}

/** Textos del idioma indicado (o del activo). */
export function getT(lang: Lang = current): Messages {
  const hit = cache[lang];
  if (hit) return hit;
  const built = withTokens(Object.fromEntries(Object.entries(messages).map(([ns, m]) => [ns, m[lang]])) as Messages);
  cache[lang] = built;
  return built;
}
