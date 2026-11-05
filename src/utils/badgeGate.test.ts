// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { canShowBadgeNotice, nextBadgeNotice } from './badgeGate';

describe('aviso «¡Ganaste una insignia!» durante una alerta', () => {
  const queue = [{ id: 1 }, { id: 2 }];

  it('nunca se muestra con una alerta activa', () => {
    expect(canShowBadgeNotice({ activeAlertId: 'a1', pathname: '/inicio' })).toBe(false);
    expect(nextBadgeNotice(queue, { activeAlertId: 'a1', pathname: '/inicio' })).toBeNull();
  });

  it('nunca se muestra en la pantalla de alerta, aunque no haya alerta activa', () => {
    expect(canShowBadgeNotice({ activeAlertId: null, pathname: '/alerta' })).toBe(false);
    expect(canShowBadgeNotice({ activeAlertId: null, pathname: '/alerta/x' })).toBe(false);
  });

  it('nunca se muestra durante un simulacro', () => {
    expect(canShowBadgeNotice({ activeAlertId: null, pathname: '/inicio', drillActive: true })).toBe(false);
  });

  it('queda en cola y aparece (de una en una, en orden) cuando la alerta termina', () => {
    const during = nextBadgeNotice(queue, { activeAlertId: 'a1', pathname: '/alerta' });
    expect(during).toBeNull();
    const after = nextBadgeNotice(queue, { activeAlertId: null, pathname: '/despues-del-sismo' });
    expect(after).toEqual({ id: 1 });
  });

  it('sin avisos en cola no hay nada que mostrar', () => {
    expect(nextBadgeNotice([], { activeAlertId: null, pathname: '/inicio' })).toBeNull();
    expect(canShowBadgeNotice({ activeAlertId: null, pathname: '/alertas-viejas' })).toBe(true);
  });
});
