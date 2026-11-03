// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';

/**
 * Mantiene la pantalla encendida mientras hay una alerta activa.
 * - App Android: bandera FLAG_KEEP_SCREEN_ON de la ventana.
 * - Navegador: Screen Wake Lock API (el navegador la libera si la pestaña se oculta).
 */
let wakeLock: WakeLockSentinel | null = null;

/**
 * Android: muestra SISMO encima de la pantalla bloqueada durante la alerta (ficha médica visible para
 * rescatistas sin desbloquear). En el navegador no existe equivalente.
 */
export async function showOverLockScreen(on: boolean): Promise<void> {
  if (isNative()) await SismoNative.setShowWhenLocked({ on }).catch(() => undefined);
}

/**
 * Android: enciende la pantalla y muestra SISMO sobre la de bloqueo (aviso «¿Está bien?» tras una caída
 * con la pantalla apagada). En el navegador no existe equivalente.
 */
export async function wakeForAttention(): Promise<void> {
  if (!isNative()) return;
  await SismoNative.setShowWhenLocked({ on: true }).catch(() => undefined);
  await SismoNative.wakeScreen().catch(() => undefined);
}

export async function keepScreenOn(on: boolean): Promise<void> {
  if (isNative()) {
    await SismoNative.setKeepScreenOn({ on }).catch(() => undefined);
    return;
  }
  if (!('wakeLock' in navigator)) return;
  try {
    if (on && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    // El navegador puede negarlo (batería baja, pestaña oculta): la alerta sigue igual.
  }
}
