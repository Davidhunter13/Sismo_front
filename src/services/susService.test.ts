// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { SUS_ITEMS, SUS_SCALE, susGrade, susScore, susToCsv } from './susService';

describe('susScore', () => {
  it('tiene 10 afirmaciones', () => {
    expect(SUS_ITEMS).toHaveLength(10);
  });
  it('todo neutral = 50', () => {
    expect(susScore(Array(10).fill(3))).toBe(50);
  });
  it('mejor respuesta posible = 100 y peor = 0', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
  });
  it('ejemplo calculado a mano: 4,2,4,2,4,2,4,2,4,2 = 75', () => {
    expect(susScore([4, 2, 4, 2, 4, 2, 4, 2, 4, 2])).toBe(75);
  });
  it('rechaza respuestas incompletas o fuera de rango', () => {
    expect(() => susScore([3, 3, 3])).toThrow();
    expect(() => susScore([...Array(9).fill(3), 6])).toThrow();
    expect(() => susScore([...Array(9).fill(3), 2.5])).toThrow();
  });
});

describe('susGrade', () => {
  it('interpreta por rangos', () => {
    expect(susGrade(90)).toBe('Excelente');
    expect(susGrade(70)).toBe('Aceptable (sobre el promedio)');
    expect(susGrade(40)).toBe('Deficiente');
  });
});

describe('susToCsv', () => {
  it('una columna por pregunta y el puntaje', () => {
    const csv = susToCsv([{ id: 'r1', answeredAt: '2026-11-01', answers: Array(10).fill(3), score: 50, drillAlertId: 'a1' }]);
    const [header, row] = csv.split('\n');
    expect(header).toBe('id,fecha,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,puntaje,tras_simulacro');
    expect(row).toBe('r1,2026-11-01,3,3,3,3,3,3,3,3,3,3,50,si');
  });
});

describe('SUS en inglés', () => {
  beforeEach(() => setLang('en'));
  afterEach(() => setLang('es'));

  it('afirmaciones y escala estándar (Brooke) e interpretación', () => {
    expect(SUS_ITEMS).toHaveLength(10);
    expect(SUS_ITEMS[0]).toBe('I think that I would like to use this app frequently.');
    expect(SUS_SCALE[0]).toBe('Strongly disagree');
    expect(SUS_SCALE).toHaveLength(5);
    expect(SUS_SCALE.map((s) => s)).toEqual(['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']);
    expect(susGrade(90)).toBe('Excellent');
    expect(susGrade(70)).toBe('Acceptable (above average)');
    expect(susGrade(40)).toBe('Poor');
  });

  it('vuelve al español al cambiar de idioma', () => {
    setLang('es');
    expect(SUS_ITEMS[0]).toBe('Creo que me gustaría usar esta aplicación con frecuencia.');
  });
});
