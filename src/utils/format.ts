// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { EventType } from '../types';

const dateTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const time = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const longDate = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatTime = (iso: string) => time.format(new Date(iso));
export const formatLongDate = (d = new Date()) => longDate.format(d);
export const formatCoord = (n: number) => n.toFixed(5);

export const eventTypeLabel: Record<EventType, string> = {
  sismo: 'Sismo',
  emergencia_general: 'Otra emergencia',
  prueba: 'Prueba del sistema',
};

export function formatDuration(fromIso: string, toIso?: string): string {
  const ms = Math.max(0, (toIso ? new Date(toIso) : new Date()).getTime() - new Date(fromIso).getTime());
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min ${s.toString().padStart(2, '0')} s`;
}
