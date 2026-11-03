// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AlertMetrics, AlertRecord } from '../types';
import { getT } from '../i18n';
import { eventTypeLabel } from '../utils/format';

/**
 * Métricas de validación. Las marcas se toman durante la activación (antes de que exista el registro
 * de la alerta) y se copian al crearla con takeTrace().
 */
let trace: AlertMetrics = {};

export function beginTrace(): void {
  trace = { sosPressedAt: Date.now() };
}

export function mark(key: keyof AlertMetrics): void {
  trace[key] = Date.now();
}

/** Copia las marcas reunidas y deja la traza lista para la siguiente activación. */
export function takeTrace(): AlertMetrics {
  const t = trace;
  trace = {};
  return t;
}

// ---------- Cálculo ----------

export type MetricKey = 'decision' | 'siren' | 'torch' | 'vibration' | 'sms' | 'drillReaction';

/** Nombres de las métricas en el idioma activo (se leen al acceder, como `eventTypeLabel`). */
export const metricLabels = new Proxy({} as Record<MetricKey, string>, {
  get: (_, key) => getT().services.metrics[key as MetricKey],
});

/** Duración en ms de cada métrica de una alerta, o undefined si falta alguna marca. */
export function metricValue(alert: AlertRecord, key: MetricKey): number | undefined {
  const m = alert.metrics;
  if (!m) return undefined;
  const diff = (a?: number, b?: number) => (a != null && b != null && a >= b ? a - b : undefined);
  switch (key) {
    case 'decision': return diff(m.confirmedAt, m.sosPressedAt);
    case 'siren': return diff(m.sirenAt, m.confirmedAt);
    case 'torch': return diff(m.torchAt, m.confirmedAt);
    case 'vibration': return diff(m.vibrationAt, m.confirmedAt);
    case 'sms': return diff(m.smsAt, m.confirmedAt);
    case 'drillReaction': return diff(m.confirmedAt, m.drillSignalAt);
  }
}

export interface MetricSummary {
  count: number;
  mean?: number;
  median?: number;
  max?: number;
}

export function summarize(values: number[]): MetricSummary {
  if (values.length === 0) return { count: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    count: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    max: sorted[sorted.length - 1],
  };
}

export function formatMs(ms?: number): string {
  if (ms == null) return '—';
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

// ---------- Exportación CSV ----------

const csvCell = (v: string | number | undefined) => {
  const s = v == null ? '' : String(v);
  // Neutraliza fórmulas al abrir en hojas de cálculo (inyección CSV) y escapa comillas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV sin datos personales: ni nombre, ni contactos, ni coordenadas. */
export function alertsToCsv(alerts: AlertRecord[]): string {
  const keys: MetricKey[] = ['decision', 'siren', 'torch', 'vibration', 'sms', 'drillReaction'];
  const header = ['id', 'fecha', 'tipo', 'simulacro', 'origen', 'estado_canal_digital', 'con_ubicacion', 'precision_m', 'actualizaciones_ubicacion', ...keys.map((k) => `${k}_ms`)];
  const rows = alerts.map((a) => [
    a.id,
    a.activatedAt,
    eventTypeLabel[a.eventType],
    a.isDrill ? 'si' : 'no',
    a.source ?? 'app',
    a.digitalStatus,
    a.location ? 'si' : 'no',
    a.location?.accuracy != null ? Math.round(a.location.accuracy) : undefined,
    a.locationUpdates ?? 0,
    ...keys.map((k) => {
      const v = metricValue(a, k);
      return v != null ? Math.round(v) : undefined;
    }),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
