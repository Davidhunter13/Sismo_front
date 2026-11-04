// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLang, getLocale } from '../i18n';
import { getCatalogs, labelOf } from '../services/catalogService';

// Formatos según el idioma activo (es-CO o en-US).
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
export const formatLongDate = (d = new Date()) =>
  new Intl.DateTimeFormat(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
export const formatCoord = (n: number) => n.toFixed(5);

/** Nombre del tipo de evento (catálogo) en el idioma activo; se lee en el momento de usarse. */
export const eventTypeLabel = new Proxy({} as Record<string, string>, {
  get: (_, key) => labelOf(getCatalogs().eventTypes, String(key), getLang()),
});

export function formatDuration(fromIso: string, toIso?: string): string {
  const ms = Math.max(0, (toIso ? new Date(toIso) : new Date()).getTime() - new Date(fromIso).getTime());
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min ${s.toString().padStart(2, '0')} s`;
}
