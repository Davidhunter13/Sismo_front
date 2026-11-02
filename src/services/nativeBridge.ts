// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Plugin propio de Android (android/app/src/main/java/co/edu/poli/sismo/SismoNativePlugin.java).
 * Solo existe en la app nativa; en el navegador cada servicio usa su alternativa web.
 */
export interface SismoNativePlugin {
  startSiren(): Promise<void>;
  stopSiren(): Promise<void>;
  startTorch(): Promise<void>;
  stopTorch(): Promise<void>;
  startVibration(): Promise<void>;
  stopVibration(): Promise<void>;
  stopAll(): Promise<void>;
  getStatus(): Promise<{ siren: boolean; torch: boolean; vibration: boolean; hasFlash: boolean }>;
  setKeepScreenOn(options: { on: boolean }): Promise<void>;
  requestNotifications(): Promise<{ granted: boolean }>;
  consumeLaunchAction(): Promise<{ action: 'sos' | null }>;
  shareCsv(options: { filename: string; content: string }): Promise<void>;
  addListener(event: 'sosRequested', listener: () => void): Promise<PluginListenerHandle>;
}

export const SismoNative = registerPlugin<SismoNativePlugin>('SismoNative');

export const isNative = (): boolean => Capacitor.isNativePlatform();
