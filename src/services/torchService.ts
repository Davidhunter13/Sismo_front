// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';

/**
 * Linterna en código SOS (··· ––– ···).
 * - App Android: servicio nativo con CameraManager.setTorchMode (no abre la cámara ni pide su permiso;
 *   sigue destellando con la pantalla bloqueada).
 * - Navegador: API de cámara con la restricción `torch` (Chrome en Android, HTTPS o localhost).
 *   La cámara se abre solo para el flash: no se muestra, graba ni envía ninguna imagen.
 */
export type TorchResult = 'ok' | 'unsupported' | 'denied';

/**
 * Duraciones (ms) alternando encendido/apagado, empezando por encendido. Unidad de 250 ms:
 * punto = 1, raya = 3, pausa entre señales = 1, entre letras = 3, entre repeticiones = 7.
 * Debe coincidir con SOS_ON_OFF de AlertService.java.
 */
const U = 250;
export const SOS_ON_OFF = [U, U, U, U, U, 3 * U, 3 * U, U, 3 * U, U, 3 * U, 3 * U, U, U, U, U, U, 7 * U];

let stream: MediaStream | null = null;
let timer: number | null = null;
let nativeOn = false;

export function isTorchApiAvailable(): boolean {
  if (isNative()) return true;
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
}

export function isTorchOn(): boolean {
  return isNative() ? nativeOn : timer !== null;
}

export function syncNativeTorch(on: boolean): void {
  nativeOn = on;
}

function setTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  return track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
}

export async function startTorchBlink(): Promise<TorchResult> {
  if (isNative()) {
    try {
      await SismoNative.startTorch();
      nativeOn = true;
      return 'ok';
    } catch {
      nativeOn = false;
      return 'unsupported';
    }
  }
  if (timer !== null) return 'ok';
  if (!isTorchApiAvailable()) return 'unsupported';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
  } catch {
    return 'denied';
  }
  const [track] = stream.getVideoTracks();
  const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
  if (!track || !caps.torch) {
    stopTorch();
    return 'unsupported';
  }
  let step = 0;
  const tick = () => {
    setTorch(track, step % 2 === 0).catch(() => stopTorch());
    const wait = SOS_ON_OFF[step];
    step = (step + 1) % SOS_ON_OFF.length;
    timer = window.setTimeout(tick, wait);
  };
  tick();
  return 'ok';
}

export function stopTorch(): void {
  if (isNative()) {
    nativeOn = false;
    void SismoNative.stopTorch().catch(() => undefined);
    return;
  }
  if (timer !== null) window.clearTimeout(timer);
  timer = null;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}
