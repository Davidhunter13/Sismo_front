// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Pedido de SOS desde fuera de la pantalla de inicio (widget o acceso rápido de Android).
 * - `immediate = false`: abrir el diálogo de SOS (acceso rápido).
 * - `immediate = true`: activar la alerta ya (doble toque del widget, que ya fue la confirmación).
 * Si la pantalla de inicio aún no está montada, el pedido queda pendiente hasta que se suscriba.
 */
type Listener = (immediate: boolean) => void;

let pending: boolean | null = null;
const listeners = new Set<Listener>();

export function requestSosDialog(immediate = false): void {
  if (listeners.size === 0) {
    // Un pedido inmediato no se rebaja a diálogo si llega otro antes de que se monte Inicio.
    pending = pending === true || immediate;
    return;
  }
  listeners.forEach((l) => l(immediate));
}

export function onSosDialogRequest(listener: Listener): () => void {
  listeners.add(listener);
  if (pending !== null) {
    const immediate = pending;
    pending = null;
    listener(immediate);
  }
  return () => listeners.delete(listener);
}
