// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { isNative, SismoNative } from './nativeBridge';

/**
 * Importar un contacto de la agenda del teléfono.
 * - App Android: selector del sistema (ACTION_PICK); no requiere el permiso de leer todos los contactos.
 * - Navegador: Contact Picker API (Chrome en Android).
 * Solo se lee el contacto que la persona elige.
 */
export interface PickedContact {
  name: string;
  phone: string;
}

interface ContactsManager {
  select(props: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>;
}

export function isContactPickerSupported(): boolean {
  return isNative() || (typeof navigator !== 'undefined' && 'contacts' in navigator);
}

/** Devuelve el contacto elegido, o null si se canceló o no tiene teléfono. */
export async function pickContact(): Promise<PickedContact | null> {
  if (isNative()) {
    const r = await SismoNative.pickContact();
    return !r.cancelled && r.phone ? { name: r.name ?? '', phone: r.phone } : null;
  }
  const contacts = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
  if (!contacts) return null;
  const [c] = await contacts.select(['name', 'tel'], { multiple: false });
  const phone = c?.tel?.[0];
  return phone ? { name: c.name?.[0] ?? '', phone } : null;
}
