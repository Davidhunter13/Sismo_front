// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { bearingDeg, cardinal, headingFromEvent, normalize } from './compassService';

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

describe('bearingDeg', () => {
  it('norte, este, sur y oeste exactos', () => {
    expect(bearingDeg(0, 0, 1, 0)).toBeCloseTo(0, 5);
    expect(bearingDeg(0, 0, 0, 1)).toBeCloseTo(90, 5);
    expect(bearingDeg(1, 0, 0, 0)).toBeCloseTo(180, 5);
    expect(bearingDeg(0, 1, 0, 0)).toBeCloseTo(270, 5);
  });
  it('Bogotá → Medellín queda al noroeste (~315°)', () => {
    const b = bearingDeg(4.711, -74.0721, 6.2442, -75.5812);
    expect(b).toBeGreaterThan(300);
    expect(b).toBeLessThan(330);
    expect(cardinal(b, CARDINALS)).toBe('NO');
  });
});

describe('normalize y cardinal', () => {
  it('normaliza ángulos negativos y mayores de 360', () => {
    expect(normalize(-90)).toBe(270);
    expect(normalize(450)).toBe(90);
  });
  it('redondea al rumbo más cercano', () => {
    expect(cardinal(10, CARDINALS)).toBe('N');
    expect(cardinal(350, CARDINALS)).toBe('N');
    expect(cardinal(100, CARDINALS)).toBe('E');
  });
});

describe('headingFromEvent', () => {
  it('Android/Chrome: evento absoluto, orientación = 360 − alpha', () => {
    expect(headingFromEvent({ alpha: 90, absolute: true })).toBe(270);
  });
  it('iOS: usa webkitCompassHeading', () => {
    expect(headingFromEvent({ alpha: 10, webkitCompassHeading: 45 })).toBe(45);
  });
  it('sin referencia al norte no sirve como brújula', () => {
    expect(headingFromEvent({ alpha: 90, absolute: false })).toBeNull();
    expect(headingFromEvent({ alpha: null, absolute: true })).toBeNull();
  });
});
