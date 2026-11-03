// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLocale } from '../i18n';
import { isNative, SismoNative } from './nativeBridge';

/**
 * Lectura en voz alta de la guía de emergencia, con la voz del idioma activo (getLocale()).
 * - App Android: TextToSpeech del sistema (el WebView de Android no ofrece speechSynthesis).
 * - Navegador: Web Speech API.
 */
export function isSpeechSupported(): boolean {
  return isNative() || (typeof window !== 'undefined' && 'speechSynthesis' in window);
}

export async function speak(text: string, onEnd?: () => void): Promise<boolean> {
  if (isNative()) {
    try {
      await SismoNative.speak({ text, lang: getLocale() });
      // El plugin no notifica el final: se consulta hasta que termine. La primera consulta espera a que
      // el motor de voz arranque (la primera vez se inicializa).
      window.setTimeout(() => {
        const poll = window.setInterval(async () => {
          const { speaking } = await SismoNative.isSpeaking().catch(() => ({ speaking: false }));
          if (!speaking) {
            window.clearInterval(poll);
            onEnd?.();
          }
        }, 1000);
      }, 2500);
      return true;
    } catch {
      return false;
    }
  }
  if (!isSpeechSupported()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = getLocale();
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (isNative()) {
    void SismoNative.stopSpeaking().catch(() => undefined);
    return;
  }
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
