// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it, vi } from 'vitest';
import { createFallDetector } from './fallDetectionService';

const G = 9.81;

describe('createFallDetector', () => {
  it('caída libre seguida de impacto dispara la detección', () => {
    const onFall = vi.fn();
    const feed = createFallDetector(onFall);
    feed(1 * G, 0);
    feed(0.1 * G, 100); // caída libre
    feed(3 * G, 500); // impacto dentro de la ventana
    expect(onFall).toHaveBeenCalledTimes(1);
  });

  it('un movimiento brusco normal (sin caída libre) no dispara', () => {
    const onFall = vi.fn();
    const feed = createFallDetector(onFall);
    feed(1 * G, 0);
    feed(3 * G, 100);
    expect(onFall).not.toHaveBeenCalled();
  });

  it('el impacto llega tarde (> 1 s después de la caída) y no dispara', () => {
    const onFall = vi.fn();
    const feed = createFallDetector(onFall);
    feed(0.1 * G, 0);
    feed(3 * G, 1500);
    expect(onFall).not.toHaveBeenCalled();
  });

  it('un impacto muy fuerte dispara aunque no haya caída libre', () => {
    const onFall = vi.fn();
    createFallDetector(onFall)(4.5 * G, 0);
    expect(onFall).toHaveBeenCalledTimes(1);
  });

  it('ignora nuevas detecciones durante el periodo de espera', () => {
    const onFall = vi.fn();
    const feed = createFallDetector(onFall);
    feed(4.5 * G, 0);
    feed(4.5 * G, 10_000);
    feed(4.5 * G, 61_000);
    expect(onFall).toHaveBeenCalledTimes(2);
  });
});
