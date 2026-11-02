// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { AlertRecord } from '../types';
import { alertsToCsv, formatMs, metricValue, summarize } from './metricsService';

const alert = (patch: Partial<AlertRecord> = {}): AlertRecord => ({
  id: 'a1',
  eventType: 'sismo',
  status: 'finalizada',
  activatedAt: '2026-11-01T10:00:00.000Z',
  location: { latitude: 4.65, longitude: -74.1, accuracy: 20, timestamp: '', source: 'dispositivo' },
  digitalStatus: 'sms_abierto',
  simulatedDelivery: false,
  contactsCount: 2,
  isSeed: false,
  metrics: { sosPressedAt: 1000, confirmedAt: 3500, sirenAt: 3520, smsAt: 9500, drillSignalAt: 500 },
  ...patch,
});

describe('metricValue', () => {
  it('calcula cada intervalo a partir de las marcas', () => {
    const a = alert();
    expect(metricValue(a, 'decision')).toBe(2500);
    expect(metricValue(a, 'siren')).toBe(20);
    expect(metricValue(a, 'sms')).toBe(6000);
    expect(metricValue(a, 'drillReaction')).toBe(3000);
  });
  it('devuelve undefined si falta una marca o el orden es imposible', () => {
    expect(metricValue(alert(), 'torch')).toBeUndefined();
    expect(metricValue(alert({ metrics: { sosPressedAt: 5000, confirmedAt: 1000 } }), 'decision')).toBeUndefined();
    expect(metricValue(alert({ metrics: undefined }), 'decision')).toBeUndefined();
  });
});

describe('summarize', () => {
  it('mediana con cantidad par e impar', () => {
    expect(summarize([3, 1, 2])).toMatchObject({ count: 3, median: 2, mean: 2, max: 3 });
    expect(summarize([4, 1, 3, 2]).median).toBe(2.5);
  });
  it('sin datos', () => {
    expect(summarize([])).toEqual({ count: 0 });
  });
});

describe('formatMs', () => {
  it('ms por debajo de 1 s, segundos con un decimal por encima', () => {
    expect(formatMs(250)).toBe('250 ms');
    expect(formatMs(2500)).toBe('2.5 s');
    expect(formatMs(undefined)).toBe('—');
  });
});

describe('alertsToCsv', () => {
  it('no exporta coordenadas y sí la precisión y las métricas', () => {
    const csv = alertsToCsv([alert()]);
    expect(csv).not.toContain('4.65');
    expect(csv).not.toContain('-74.1');
    expect(csv.split('\n')[1]).toContain(',20,');
    expect(csv).toContain('2500');
  });
  it('neutraliza valores que una hoja de cálculo interpretaría como fórmula', () => {
    const csv = alertsToCsv([alert({ id: '=HYPERLINK("x")' })]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
