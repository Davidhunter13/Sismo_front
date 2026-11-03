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

/** Textos del idioma indicado (o del activo). */
export function getT(lang: Lang = current): Messages {
  const hit = cache[lang];
  if (hit) return hit;
  const built = Object.fromEntries(Object.entries(messages).map(([ns, m]) => [ns, m[lang]])) as Messages;
  cache[lang] = built;
  return built;
}
