// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadData } from './storageService';

function stubStorage(value: unknown) {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(value), setItem: () => undefined, removeItem: () => undefined });
}

afterEach(() => vi.unstubAllGlobals());

describe('loadData: migración de puntos de encuentro', () => {
  it('convierte el punto único de versiones anteriores en una lista', () => {
    stubStorage({ version: 1, meetingPoint: { label: 'Parque', latitude: 4.6, longitude: -74 } });
    const data = loadData();
    expect(data.meetingPoints).toHaveLength(1);
    expect(data.meetingPoints[0]).toMatchObject({ label: 'Parque', latitude: 4.6, longitude: -74 });
    expect(data.meetingPoints[0].id).toBeTruthy();
    expect('meetingPoint' in data).toBe(false);
  });
  it('respeta la lista nueva y sin datos queda vacía', () => {
    stubStorage({ version: 1, meetingPoints: [{ id: 'x', label: 'Casa', latitude: 1, longitude: 2 }] });
    expect(loadData().meetingPoints).toEqual([{ id: 'x', label: 'Casa', latitude: 1, longitude: 2 }]);
    stubStorage({ version: 1, meetingPoint: null });
    expect(loadData().meetingPoints).toEqual([]);
  });
});
