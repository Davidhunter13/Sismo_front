// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Pedido de abrir el diálogo de SOS desde fuera de la pantalla de inicio (widget o acceso rápido de Android).
 * Si la pantalla de inicio aún no está montada, el pedido queda pendiente hasta que se suscriba.
 */
type Listener = () => void;

let pending = false;
const listeners = new Set<Listener>();

export function requestSosDialog(): void {
  if (listeners.size === 0) {
    pending = true;
    return;
  }
  listeners.forEach((l) => l());
}

export function onSosDialogRequest(listener: Listener): () => void {
  listeners.add(listener);
  if (pending) {
    pending = false;
    listener();
  }
  return () => listeners.delete(listener);
}
