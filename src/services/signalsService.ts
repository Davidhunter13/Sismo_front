// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Settings } from '../types';
import { mark } from './metricsService';
import { isNative, SismoNative } from './nativeBridge';
import { keepScreenOn } from './screenService';
import { startSiren, stopSiren, syncNativeSiren } from './sirenService';
import { startTorchBlink, stopTorch, syncNativeTorch } from './torchService';
import { startVibration, stopVibration, syncNativeVibration } from './vibrationService';

/**
 * Enciende las señales locales según la configuración. Debe llamarse dentro del toque de confirmación
 * del SOS: los navegadores bloquean audio, cámara y vibración sin gesto del usuario.
 * La linterna automática solo aplica en la app nativa (en escritorio encendería la webcam sin flash).
 */
export function startAlertSignals(settings: Settings): void {
  if (settings.soundEnabled) {
    void startSiren().then((ok) => ok && mark('sirenAt'));
  }
  if (isNative() && settings.visualSignalEnabled && !settings.reduceMotion) {
    void startTorchBlink().then((r) => r === 'ok' && mark('torchAt'));
  }
  if (settings.vibrationEnabled) {
    void startVibration().then((ok) => ok && mark('vibrationAt'));
  }
}

export function stopAlertSignals(): void {
  stopSiren();
  stopTorch();
  stopVibration();
  void keepScreenOn(false);
}

/** En Android las señales se pueden apagar desde la notificación: se lee su estado real. */
export async function refreshNativeSignals(): Promise<void> {
  if (!isNative()) return;
  try {
    const s = await SismoNative.getStatus();
    syncNativeSiren(s.siren);
    syncNativeTorch(s.torch);
    syncNativeVibration(s.vibration);
  } catch {
    // Plugin no disponible: se conserva el último estado conocido.
  }
}
