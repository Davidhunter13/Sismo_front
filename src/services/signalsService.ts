// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Settings } from '../types';
import { mark } from './metricsService';
import { isNative, SismoNative } from './nativeBridge';
import { keepScreenOn } from './screenService';
import { startSiren, stopSiren, syncNativeSiren } from './sirenService';
import { startTorchBlink, stopTorch, syncNativeTorch } from './torchService';
import { stopTrapped, syncNativeTrapped } from './trappedService';
import { startVibration, stopVibration, syncNativeVibration } from './vibrationService';

/**
 * Enciende las señales locales según la configuración. Debe llamarse dentro del toque de confirmación
 * del SOS: los navegadores bloquean audio, cámara y vibración sin gesto del usuario.
 * La linterna automática solo aplica en la app nativa (en escritorio encendería la webcam sin flash).
 */
export function startAlertSignals(settings: Settings): void {
  if (settings.soundEnabled) {
    void startSiren(settings.alarmSound).then((ok) => ok && mark('sirenAt'));
  }
  if (isNative() && settings.visualSignalEnabled && !settings.reduceMotion) {
    void startTorchBlink().then((r) => r === 'ok' && mark('torchAt'));
  }
  if (settings.vibrationEnabled) {
    void startVibration().then((ok) => ok && mark('vibrationAt'));
  }
}

export function stopAlertSignals(): void {
  void stopTrapped();
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
    syncNativeTrapped(s.trapped);
  } catch {
    // Plugin no disponible: se conserva el último estado conocido.
  }
}

/**
 * Alerta activada con el doble toque del widget: Android ya encendió sirena, linterna y vibración antes de
 * que cargara la app (MainActivity). Aquí se ajustan a la Configuración del usuario: se apagan las que tenga
 * desactivadas. El sonido queda en sirena aunque se haya elegido el silbato: cambiarlo exigiría apagarla y
 * volver a encenderla, y el servicio procesa las órdenes en otro hilo (podría quedar en silencio).
 */
export async function adoptNativeAlertSignals(settings: Settings): Promise<void> {
  if (!isNative()) {
    startAlertSignals(settings);
    return;
  }
  await refreshNativeSignals();
  if (!settings.soundEnabled) stopSiren();
  else mark('sirenAt');
  if (!settings.visualSignalEnabled || settings.reduceMotion) stopTorch();
  if (!settings.vibrationEnabled) stopVibration();
}
