// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * El aviso «¡Ganaste una insignia!» NUNCA se muestra durante una emergencia: con una alerta activa, en la pantalla
 * de alerta ni durante un simulacro (distraería a la persona o alteraría el tiempo de reacción). Queda en cola y
 * aparece cuando la alerta termina. Tampoco durante el registro (Bienvenida, Registro o mientras no lo termine):
 * las insignias ganadas esperan y aparecen en Inicio. Funciones puras (probadas en badgeGate.test.ts).
 */
export interface GateState {
  activeAlertId: string | null;
  pathname: string;
  drillActive?: boolean;
  /** La persona se está registrando (aún no terminó el registro). Solo lo usa el aviso de insignias. */
  registering?: boolean;
}

/** Pantallas del registro, donde no se interrumpe con avisos de insignias. */
const REGISTRATION_PATHS = ['/bienvenida', '/registro'];

export function canShowBadgeNotice({ activeAlertId, pathname, drillActive }: GateState): boolean {
  if (activeAlertId) return false;
  if (pathname === '/alerta' || pathname.startsWith('/alerta/')) return false;
  if (drillActive) return false;
  return true;
}

/** Siguiente aviso a mostrar, o null si no hay o si ahora no se puede. */
export function nextBadgeNotice<T>(queue: T[], state: GateState): T | null {
  if (state.registering || REGISTRATION_PATHS.includes(state.pathname)) return null;
  return queue.length > 0 && canShowBadgeNotice(state) ? queue[0] : null;
}
