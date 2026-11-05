// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { layoutSpikes, quakeDotSize, quakeLevel, quakePulseSeconds, quakeWaves } from './quakeViz';

describe('intensidad del sismo', () => {
  it('clasifica por magnitud con los cortes del panel', () => {
    expect(quakeLevel(2.5)).toBe('low');
    expect(quakeLevel(3.99)).toBe('low');
    expect(quakeLevel(4)).toBe('mid');
    expect(quakeLevel(4.9)).toBe('mid');
    expect(quakeLevel(5)).toBe('high');
  });

  it('entre más intenso, punto más grande, más ondas y ráfaga más rápida', () => {
    expect(quakeDotSize(2.5)).toBe(12);
    expect(quakeDotSize(4)).toBeGreaterThan(quakeDotSize(3));
    expect(quakeDotSize(9)).toBe(46);
    expect([quakeWaves(3), quakeWaves(4.2), quakeWaves(6)]).toEqual([1, 2, 3]);
    expect(quakePulseSeconds(6)).toBeLessThan(quakePulseSeconds(3));
  });
});

describe('layoutSpikes', () => {
  const from = Date.UTC(2026, 10, 4, 0);
  const to = from + 86_400_000;
  const opts = { from, to, width: 600, height: 200, padLeft: 40, padRight: 10, padTop: 10, padBottom: 30 };

  it('ubica cada pico por hora y magnitud, con la base en M2', () => {
    const l = layoutSpikes([{ id: 'a', magnitude: 4, time: from + 43_200_000 }, { id: 'b', magnitude: 2, time: from }], opts);
    expect(l.baseline).toBe(170);
    const a = l.spikes.find((s) => s.id === 'a')!;
    expect(a.x).toBeCloseTo(40 + 550 / 2);
    expect(a.y).toBeCloseTo(170 - (2 / 4) * 160); // escala 2–6
    expect(l.spikes[0].id).toBe('b'); // ordenados por tiempo
    expect(l.spikes[0].y).toBe(170);
  });

  it('amplía el eje si hay un sismo mayor a 6 y marca el más fuerte', () => {
    const l = layoutSpikes([{ id: 'x', magnitude: 6.4, time: from + 1000 }, { id: 'y', magnitude: 3, time: from + 2000 }], opts);
    expect(l.yTicks.map((t) => t.value)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(l.strongest?.id).toBe('x');
    expect(l.strongest?.level).toBe('high');
  });

  it('marcas de tiempo cada 6 h en 24 h y cada día en 7 días', () => {
    expect(layoutSpikes([], opts).xTicks).toHaveLength(5);
    expect(layoutSpikes([], { ...opts, to: from + 7 * 86_400_000 }).xTicks).toHaveLength(8);
    expect(layoutSpikes([], opts).strongest).toBeNull();
  });
});
