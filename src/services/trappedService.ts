// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';
import { keepScreenOn } from './screenService';
import { playWhistleBurst, stopSiren } from './sirenService';
import { stopTorch } from './torchService';
import { stopVibration } from './vibrationService';

/**
 * Modo atrapado: para quien queda bajo escombros y necesita que la batería dure horas.
 * Apaga las señales continuas, deja apagar la pantalla, baja el brillo y emite cada TRAPPED_INTERVAL_MS
 * una ráfaga corta: tres pitidos de silbato + un ciclo de linterna SOS (Android) o vibración (navegador).
 * En Android lo ejecuta el servicio nativo con un WakeLock parcial, así que sigue con la pantalla apagada.
 * En el navegador solo funciona mientras la pestaña esté visible.
 */
export const TRAPPED_INTERVAL_MS = 3 * 60_000;
const WEB_BURST_VIBRATION = [500, 300, 500, 300, 500];

let trapped = false;
let webTimer: number | null = null;

export function isTrapped(): boolean {
  return trapped;
}

export function syncNativeTrapped(on: boolean): void {
  trapped = on;
}

function webBurst(): void {
  void playWhistleBurst();
  if ('vibrate' in navigator) navigator.vibrate(WEB_BURST_VIBRATION);
}

export async function startTrapped(): Promise<void> {
  if (trapped) return;
  trapped = true;
  stopSiren();
  stopTorch();
  stopVibration();
  await keepScreenOn(false);
  if (isNative()) {
    await SismoNative.startTrapped({ intervalMs: TRAPPED_INTERVAL_MS }).catch(() => undefined);
    await SismoNative.setBrightness({ level: 0.05 }).catch(() => undefined);
    return;
  }
  webBurst();
  webTimer = window.setInterval(webBurst, TRAPPED_INTERVAL_MS);
}

export async function stopTrapped(): Promise<void> {
  if (!trapped) return;
  trapped = false;
  if (isNative()) {
    await SismoNative.stopTrapped().catch(() => undefined);
    await SismoNative.setBrightness({ level: -1 }).catch(() => undefined);
    return;
  }
  if (webTimer !== null) window.clearInterval(webTimer);
  webTimer = null;
}
