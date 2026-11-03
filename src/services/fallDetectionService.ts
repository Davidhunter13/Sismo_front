// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Detección de caída o impacto fuerte con el acelerómetro (DeviceMotionEvent).
 * Patrón: caída libre (aceleración total < FREE_FALL) seguida de un impacto (> IMPACT) en menos de
 * FALL_WINDOW_MS, o un impacto muy fuerte (> HARD_IMPACT) aislado.
 * Solo funciona con la app abierta en primer plano. Puede dar falsos positivos (dejar caer el teléfono),
 * por eso siempre se pregunta «¿Está bien?» antes de activar la alerta.
 */
/** Segundos para responder «¿Está bien?» antes de activar la alerta automáticamente. */
export const FALL_COUNTDOWN_S = 30;

const G = 9.81;
const FREE_FALL = 0.35 * G;
const IMPACT = 2.5 * G;
// Impacto aislado (sin caída libre previa): 6 g. Con 4 g se disparaba al apretar o sacudir el teléfono.
const HARD_IMPACT = 6 * G;
const FALL_WINDOW_MS = 1000;
/** Tras un disparo se ignoran nuevas detecciones durante este tiempo. */
const COOLDOWN_MS = 60_000;

export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/** Lógica pura del detector (sin eventos), para poder probarla con datos sintéticos. */
export function createFallDetector(onFall: () => void) {
  let freeFallAt = -Infinity;
  let lastTrigger = -Infinity;
  return (magnitude: number, now: number) => {
    if (now - lastTrigger < COOLDOWN_MS) return;
    if (magnitude < FREE_FALL) freeFallAt = now;
    const fallThenImpact = magnitude > IMPACT && now - freeFallAt <= FALL_WINDOW_MS;
    if (fallThenImpact || magnitude > HARD_IMPACT) {
      lastTrigger = now;
      freeFallAt = -Infinity;
      onFall();
    }
  };
}

/** Empieza a escuchar el acelerómetro; devuelve la función para dejar de escuchar. */
export function watchForFalls(onFall: () => void): () => void {
  if (!isMotionSupported()) return () => undefined;
  const feed = createFallDetector(onFall);
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (a?.x == null || a.y == null || a.z == null) return;
    feed(Math.hypot(a.x, a.y, a.z), Date.now());
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
