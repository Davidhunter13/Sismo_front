// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AlarmSound } from '../types';
import { isNative, SismoNative } from './nativeBridge';

/**
 * Señal sonora local: sirena (barrido 600–1200 Hz) o silbato de rescate (tres pitidos de ~3,1 kHz,
 * señal internacional de auxilio; se oye mejor entre escombros y gasta menos batería).
 * - App Android: servicio nativo en primer plano; sigue sonando con la pantalla bloqueada.
 * - Navegador: Web Audio API (no usa archivos externos).
 */

/** Silbato: pitido / pausa / pitido / pausa / pitido / pausa larga (ms). Igual que WHISTLE_ON_OFF en AlertService.java. */
export const WHISTLE_ON_OFF = [1000, 500, 1000, 500, 1000, 2000];
const WHISTLE_CYCLE_MS = WHISTLE_ON_OFF.reduce((a, b) => a + b, 0);

let ctx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let lfo: OscillatorNode | null = null;
let gain: GainNode | null = null;
let whistleTimer: number | null = null;
let nativePlaying = false;

export function isSirenSupported(): boolean {
  if (isNative()) return true;
  return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
}

export function isSirenPlaying(): boolean {
  return isNative() ? nativePlaying : oscillator !== null;
}

/** Sincroniza el estado con el servicio nativo (el sonido se puede silenciar desde la notificación). */
export function syncNativeSiren(playing: boolean): void {
  nativePlaying = playing;
}

async function audioContext(): Promise<AudioContext> {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = ctx ?? new Ctor();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

/** Programa un ciclo de tres pitidos sobre `g` a partir de `start` (segundos del AudioContext). */
function scheduleWhistle(g: GainNode, start: number, volume: number): void {
  let t = start;
  WHISTLE_ON_OFF.forEach((ms, i) => {
    g.gain.setValueAtTime(i % 2 === 0 ? volume : 0, t);
    t += ms / 1000;
  });
  g.gain.setValueAtTime(0, t);
}

export async function startSiren(sound: AlarmSound = 'sirena', volume = 0.15): Promise<boolean> {
  if (isNative()) {
    try {
      await SismoNative.startSiren({ sound });
      nativePlaying = true;
    } catch {
      nativePlaying = false;
    }
    return nativePlaying;
  }
  if (!isSirenSupported() || oscillator) return oscillator !== null;
  const ac = await audioContext();

  oscillator = ac.createOscillator();
  gain = ac.createGain();
  if (sound === 'silbato') {
    oscillator.type = 'sine';
    oscillator.frequency.value = 3150;
    gain.gain.value = 0;
    const g = gain;
    scheduleWhistle(g, ac.currentTime, volume);
    whistleTimer = window.setInterval(() => scheduleWhistle(g, ac.currentTime, volume), WHISTLE_CYCLE_MS);
  } else {
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 900;
    // LFO que barre la frecuencia entre ~600 y ~1200 Hz (efecto sirena).
    lfo = ac.createOscillator();
    lfo.frequency.value = 1.2;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    lfo.start();
    gain.gain.value = volume;
  }
  oscillator.connect(gain).connect(ac.destination);
  oscillator.start();
  return true;
}

export function stopSiren(): void {
  if (isNative()) {
    nativePlaying = false;
    void SismoNative.stopSiren().catch(() => undefined);
    return;
  }
  if (whistleTimer !== null) window.clearInterval(whistleTimer);
  whistleTimer = null;
  oscillator?.stop();
  lfo?.stop();
  oscillator?.disconnect();
  lfo?.disconnect();
  gain?.disconnect();
  oscillator = null;
  lfo = null;
  gain = null;
}

/** Un solo ciclo de tres pitidos (ráfaga del modo atrapado en el navegador). */
export async function playWhistleBurst(volume = 0.15): Promise<void> {
  if (!isSirenSupported() || isNative()) return;
  const ac = await audioContext();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 3150;
  g.gain.value = 0;
  osc.connect(g).connect(ac.destination);
  scheduleWhistle(g, ac.currentTime, volume);
  osc.start();
  osc.stop(ac.currentTime + WHISTLE_CYCLE_MS / 1000);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}
