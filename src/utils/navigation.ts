// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { UseIonRouterResult } from '@ionic/react';

/**
 * Navega a una vista raíz (Inicio o una pestaña de la barra inferior).
 * Si esa vista es la que quedó debajo en la pila (p. ej. Inicio → Configuración → Inicio), se regresa:
 * reemplazar la ruta por una vista que ya está en la pila deja visible la vista apilada (error de Ionic).
 */
export function goToRoot(router: UseIonRouterResult, path: string): void {
  router.push(path, 'root', 'push');
}
