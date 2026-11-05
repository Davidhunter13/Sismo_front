// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Cálculos de la gráfica de picos y del mapa de sismos (sin DOM, con pruebas unitarias).
 * Intensidad por magnitud: baja < 4, media 4–4,9, alta ≥ 5 (mismos cortes que el panel de monitoreo).
 */

export type QuakeLevel = 'low' | 'mid' | 'high';

export const quakeLevel = (magnitude: number): QuakeLevel => (magnitude >= 5 ? 'high' : magnitude >= 4 ? 'mid' : 'low');

/** Diámetro del punto en el mapa (px): crece con la magnitud, entre 12 y 46. */
export const quakeDotSize = (magnitude: number): number => Math.round(Math.min(46, Math.max(12, 12 + (magnitude - 2.5) * 8)));

/** Ondas que lanza el punto en cada ráfaga: 1 (baja), 2 (media) o 3 (alta). */
export const quakeWaves = (magnitude: number): number => ({ low: 1, mid: 2, high: 3 })[quakeLevel(magnitude)];

/** Duración (s) de la ráfaga: los más fuertes laten más rápido. */
export const quakePulseSeconds = (magnitude: number): number => ({ low: 3.2, mid: 2.6, high: 2 })[quakeLevel(magnitude)];

export interface SpikeInput {
  id: string;
  magnitude: number;
  time: number;
}

export interface Spike extends SpikeInput {
  x: number;
  y: number;
  level: QuakeLevel;
}

export interface SpikeLayout {
  spikes: Spike[];
  /** Magnitudes enteras para las líneas guía del eje vertical. */
  yTicks: { value: number; y: number }[];
  /** Marcas del eje de tiempo (cada 6 h en 24 h, cada día en 7 días). */
  xTicks: { time: number; x: number }[];
  baseline: number;
  strongest: Spike | null;
}

/**
 * Posiciones de la gráfica de picos: eje x = tiempo del periodo (de `from` a `to`), eje y = magnitud desde 2 hasta
 * el entero superior a la máxima (mínimo 6). Un solo eje, la base en la magnitud 2.
 */
export function layoutSpikes(
  quakes: SpikeInput[],
  opts: { from: number; to: number; width: number; height: number; padLeft: number; padRight: number; padTop: number; padBottom: number },
): SpikeLayout {
  const { from, to, width, height, padLeft, padRight, padTop, padBottom } = opts;
  const yMin = 2;
  const yMax = Math.max(6, Math.ceil(Math.max(0, ...quakes.map((q) => q.magnitude)) + 0.01));
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baseline = padTop + plotH;
  const xOf = (t: number) => padLeft + (Math.min(Math.max(t, from), to) - from) / Math.max(1, to - from) * plotW;
  const yOf = (m: number) => baseline - (Math.min(Math.max(m, yMin), yMax) - yMin) / (yMax - yMin) * plotH;
  const spikes = [...quakes]
    .sort((a, b) => a.time - b.time)
    .map((q) => ({ ...q, x: xOf(q.time), y: yOf(q.magnitude), level: quakeLevel(q.magnitude) }));
  const yTicks = [];
  for (let v = yMin; v <= yMax; v++) yTicks.push({ value: v, y: yOf(v) });
  const day = 86_400_000;
  const step = to - from > 2 * day ? day : 6 * 3_600_000;
  const xTicks = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) xTicks.push({ time: t, x: xOf(t) });
  const strongest = spikes.reduce<Spike | null>((best, s) => (!best || s.magnitude > best.magnitude ? s : best), null);
  return { spikes, yTicks, xTicks, baseline, strongest };
}
