// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';

/**
 * Señal sonora local.
 * - App Android: servicio nativo en primer plano; sigue sonando con la pantalla bloqueada.
 * - Navegador: Web Audio API (no usa archivos externos).
 */
let ctx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let lfo: OscillatorNode | null = null;
let gain: GainNode | null = null;
let nativePlaying = false;

export function isSirenSupported(): boolean {
  if (isNative()) return true;
  return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
}

export function isSirenPlaying(): boolean {
  return isNative() ? nativePlaying : oscillator !== null;
}

/** Sincroniza el estado con el servicio nativo (la sirena se puede silenciar desde la notificación). */
export function syncNativeSiren(playing: boolean): void {
  nativePlaying = playing;
}

export async function startSiren(volume = 0.15): Promise<boolean> {
  if (isNative()) {
    try {
      await SismoNative.startSiren();
      nativePlaying = true;
    } catch {
      nativePlaying = false;
    }
    return nativePlaying;
  }
  if (!isSirenSupported() || oscillator) return oscillator !== null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = ctx ?? new Ctor();
  if (ctx.state === 'suspended') await ctx.resume();

  oscillator = ctx.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 900;

  // LFO que barre la frecuencia entre ~600 y ~1200 Hz (efecto sirena).
  lfo = ctx.createOscillator();
  lfo.frequency.value = 1.2;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain).connect(oscillator.frequency);

  gain = ctx.createGain();
  gain.gain.value = volume;
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  lfo.start();
  return true;
}

export function stopSiren(): void {
  if (isNative()) {
    nativePlaying = false;
    void SismoNative.stopSiren().catch(() => undefined);
    return;
  }
  oscillator?.stop();
  lfo?.stop();
  oscillator?.disconnect();
  lfo?.disconnect();
  gain?.disconnect();
  oscillator = null;
  lfo = null;
  gain = null;
}
