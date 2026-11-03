// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { MeetingPoint } from '../types';
import { nearestMeetingPoint } from './meetingPoints';

const casa: MeetingPoint = { id: 'a', label: 'Casa', latitude: 4.6, longitude: -74.08 };
const trabajo: MeetingPoint = { id: 'b', label: 'Trabajo', latitude: 4.7, longitude: -74.05 };

describe('nearestMeetingPoint', () => {
  it('elige el más cercano a la posición', () => {
    expect(nearestMeetingPoint([casa, trabajo], { latitude: 4.69, longitude: -74.05 })).toBe(trabajo);
    expect(nearestMeetingPoint([casa, trabajo], { latitude: 4.61, longitude: -74.08 })).toBe(casa);
  });
  it('sin posición devuelve el primero; sin puntos, null', () => {
    expect(nearestMeetingPoint([trabajo, casa], null)).toBe(trabajo);
    expect(nearestMeetingPoint([], { latitude: 4.6, longitude: -74 })).toBeNull();
  });
});
