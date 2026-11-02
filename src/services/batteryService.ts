// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';

interface BatteryLike {
  level: number;
  charging: boolean;
}

/**
 * Nivel de batería (0–100) para incluirlo en el SMS, o null si no se puede leer
 * (iPhone y Firefox no exponen la Battery API).
 */
export async function getBatteryLevel(): Promise<number | null> {
  try {
    if (isNative()) return (await SismoNative.getBattery()).level;
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    if (!nav.getBattery) return null;
    const b = await nav.getBattery();
    return Math.round(b.level * 100);
  } catch {
    return null;
  }
}
