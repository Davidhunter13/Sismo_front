// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';
import { SOS_ON_OFF } from './torchService';

/**
 * Vibración en patrón SOS (mismo ritmo que la linterna).
 * - App Android: servicio nativo (sigue con la pantalla bloqueada).
 * - Navegador: Vibration API (Chrome en Android; no existe en iPhone ni en escritorio).
 */
const CYCLE_MS = SOS_ON_OFF.reduce((a, b) => a + b, 0);

let webTimer: number | null = null;
let nativeOn = false;

export function isVibrationSupported(): boolean {
  return isNative() || (typeof navigator !== 'undefined' && 'vibrate' in navigator);
}

export function isVibrating(): boolean {
  return isNative() ? nativeOn : webTimer !== null;
}

export function syncNativeVibration(on: boolean): void {
  nativeOn = on;
}

export async function startVibration(): Promise<boolean> {
  if (isNative()) {
    try {
      await SismoNative.startVibration();
      nativeOn = true;
    } catch {
      nativeOn = false;
    }
    return nativeOn;
  }
  if (!isVibrationSupported() || webTimer !== null) return webTimer !== null;
  // navigator.vibrate no repite el patrón: se relanza en cada ciclo.
  const run = () => navigator.vibrate(SOS_ON_OFF);
  if (!run()) return false;
  webTimer = window.setInterval(run, CYCLE_MS);
  return true;
}

export function stopVibration(): void {
  if (isNative()) {
    nativeOn = false;
    void SismoNative.stopVibration().catch(() => undefined);
    return;
  }
  if (webTimer !== null) window.clearInterval(webTimer);
  webTimer = null;
  if (isVibrationSupported()) navigator.vibrate(0);
}
