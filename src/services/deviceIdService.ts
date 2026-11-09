// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Identificador del teléfono Android (ANDROID_ID), para que el servidor reconozca el mismo teléfono si la app se
 * desinstala y se vuelve a instalar (no se crea otra cuenta). No cambia al reinstalar mientras el APK se firme con
 * la misma llave. El servidor solo guarda un hash (HMAC) de este valor.
 * En la web y en iOS devuelve null: allí no hay un identificador estable equivalente.
 */
export async function deviceIdentifier(): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
  try {
    const { identifier } = await Device.getId();
    return typeof identifier === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(identifier) ? identifier : null;
  } catch {
    return null;
  }
}
