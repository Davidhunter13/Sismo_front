// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Contador de solicitudes que inicia la persona (código de recuperación, recuperar datos, buscar dirección,
 * sismos recientes). Mientras sea mayor que cero se muestra el loader de pantalla completa (components/AppLoader).
 * La sincronización automática no lo usa: sigue en silencio.
 */
let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Muestra el loader de pantalla completa mientras dura la promesa. */
export function withLoader<T>(promise: Promise<T>): Promise<T> {
  pending += 1;
  emit();
  return promise.finally(() => {
    pending = Math.max(0, pending - 1);
    emit();
  });
}

export function subscribeLoader(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isLoading = (): boolean => pending > 0;
