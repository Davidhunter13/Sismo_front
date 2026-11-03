// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it, vi } from 'vitest';
import { onSosDialogRequest, requestSosDialog } from './sosRequestService';

describe('sosRequestService', () => {
  it('pedido pendiente: se entrega al suscribirse y un inmediato no se rebaja a diálogo', () => {
    requestSosDialog(true);
    requestSosDialog(false);
    const listener = vi.fn();
    const off = onSosDialogRequest(listener);
    expect(listener).toHaveBeenCalledExactlyOnceWith(true);
    off();
  });
  it('con Inicio montado entrega cada pedido con su modo', () => {
    const listener = vi.fn();
    const off = onSosDialogRequest(listener);
    requestSosDialog();
    requestSosDialog(true);
    expect(listener.mock.calls).toEqual([[false], [true]]);
    off();
  });
});
