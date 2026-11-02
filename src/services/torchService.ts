// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Linterna intermitente con la API de cámara del navegador (restricción `torch`).
 * Solo funciona en navegadores que exponen el flash (p. ej. Chrome en Android) y en contexto seguro (HTTPS o localhost).
 * La cámara se abre únicamente para encender el flash: no se muestra, graba ni envía ninguna imagen.
 */
export type TorchResult = 'ok' | 'unsupported' | 'denied';

/** Medio periodo del parpadeo: 2 destellos por segundo, por debajo del umbral de 3/s (WCAG 2.3.1). */
const BLINK_MS = 250;

let stream: MediaStream | null = null;
let timer: number | null = null;

export function isTorchApiAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
}

export function isTorchOn(): boolean {
  return timer !== null;
}

/** Pide el permiso de cámara por adelantado (abre y cierra la cámara de inmediato, sin usar imágenes). */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isTorchApiAvailable() || timer !== null) return timer !== null;
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
    s.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

function setTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  return track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
}

export async function startTorchBlink(): Promise<TorchResult> {
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
  let on = false;
  timer = window.setInterval(() => {
    on = !on;
    setTorch(track, on).catch(() => stopTorch());
  }, BLINK_MS);
  return 'ok';
}

export function stopTorch(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}
