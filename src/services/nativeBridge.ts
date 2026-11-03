// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { AlarmSound } from '../types';

/**
 * Plugin propio de Android (android/app/src/main/java/co/edu/poli/sismo/SismoNativePlugin.java).
 * Solo existe en la app nativa; en el navegador cada servicio usa su alternativa web.
 */
export interface SismoNativePlugin {
  startSiren(options?: { sound: AlarmSound }): Promise<void>;
  startTrapped(options: { intervalMs: number }): Promise<void>;
  stopTrapped(): Promise<void>;
  setBrightness(options: { level: number }): Promise<void>;
  getBattery(): Promise<{ level: number; charging: boolean }>;
  /** `lang`: etiqueta BCP-47 de la voz (p. ej. 'en-US'); por defecto 'es-CO'. */
  speak(options: { text: string; lang?: string }): Promise<void>;
  stopSpeaking(): Promise<void>;
  isSpeaking(): Promise<{ speaking: boolean }>;
  pickContact(): Promise<{ cancelled: boolean; name?: string; phone?: string }>;
  stopSiren(): Promise<void>;
  startTorch(): Promise<void>;
  stopTorch(): Promise<void>;
  startVibration(): Promise<void>;
  stopVibration(): Promise<void>;
  stopAll(): Promise<void>;
  getStatus(): Promise<{ siren: boolean; torch: boolean; vibration: boolean; trapped: boolean; hasFlash: boolean }>;
  setKeepScreenOn(options: { on: boolean }): Promise<void>;
  setShowWhenLocked(options: { on: boolean }): Promise<void>;
  wakeScreen(): Promise<void>;
  requestNotifications(): Promise<{ granted: boolean }>;
  consumeLaunchAction(): Promise<{ action: 'sos' | null }>;
  shareCsv(options: { filename: string; content: string }): Promise<void>;
  addListener(event: 'sosRequested', listener: () => void): Promise<PluginListenerHandle>;
}

export const SismoNative = registerPlugin<SismoNativePlugin>('SismoNative');

export const isNative = (): boolean => Capacitor.isNativePlatform();
