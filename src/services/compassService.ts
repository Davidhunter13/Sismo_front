// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Brújula hacia el punto de encuentro. Funciona sin internet: solo usa el GPS y el magnetómetro.
 * - Rumbo (bearing): dirección geográfica desde la posición actual hacia el destino, 0° = norte.
 * - Orientación del teléfono (heading): a dónde apunta la parte superior del teléfono, 0° = norte.
 * La flecha se gira (rumbo − orientación) para que apunte al destino.
 */

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Normaliza un ángulo a [0, 360). */
export const normalize = (a: number) => ((a % 360) + 360) % 360;

/** Rumbo inicial de la ruta ortodrómica entre dos puntos, en grados desde el norte. */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δλ = rad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalize(deg(Math.atan2(y, x)));
}

/** Punto cardinal (8 rumbos) para mostrar junto a los grados. */
export function cardinal(bearing: number, labels: readonly string[]): string {
  return labels[Math.round(normalize(bearing) / 45) % 8];
}

interface OrientationLike {
  alpha: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
}

/**
 * Orientación respecto al norte a partir de un DeviceOrientationEvent, o null si el evento no es absoluto
 * (sin referencia al norte no se puede usar como brújula).
 */
export function headingFromEvent(e: OrientationLike): number | null {
  if (typeof e.webkitCompassHeading === 'number') return normalize(e.webkitCompassHeading); // iOS
  if (e.absolute && typeof e.alpha === 'number') return normalize(360 - e.alpha); // Android/Chrome
  return null;
}

export function isCompassSupported(): boolean {
  return typeof window !== 'undefined' && ('ondeviceorientationabsolute' in window || 'DeviceOrientationEvent' in window);
}

/** Escucha la orientación del teléfono respecto al norte; devuelve la función para dejar de escuchar. */
export function watchHeading(onHeading: (heading: number) => void): () => void {
  if (!isCompassSupported()) return () => undefined;
  const handler = (e: Event) => {
    const h = headingFromEvent(e as DeviceOrientationEvent & OrientationLike);
    if (h !== null) onHeading(h);
  };
  // Chrome expone el evento absoluto por separado; el normal sirve en iOS (webkitCompassHeading).
  const event = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
}
