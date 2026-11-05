// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Contact } from '../types';

/**
 * Contactos del correo de alerta: los principales lo reciben en «Para» y los demás en copia oculta.
 * Regla: si hay contactos reales con correo, al menos uno es principal; si ninguno está marcado, el primero lo es
 * (la misma regla aplica el servidor al enviar).
 */
const hasEmail = (c: Contact) => !c.isSeed && !!c.email?.trim();

/** Devuelve la lista con al menos un principal (o la misma lista si no hace falta cambiar nada). */
export function ensureEmailPrimary(contacts: Contact[]): Contact[] {
  const withEmail = contacts.filter(hasEmail);
  if (withEmail.length === 0 || withEmail.some((c) => c.emailPrimary)) return contacts;
  const first = withEmail[0].id;
  return contacts.map((c) => (c.id === first ? { ...c, emailPrimary: true } : c));
}

/** Papel del contacto en el correo de alerta: «Para», copia oculta, o ninguno (sin correo o de demostración). */
export function emailRole(contact: Contact): 'principal' | 'copia' | null {
  if (!hasEmail(contact)) return null;
  return contact.emailPrimary ? 'principal' : 'copia';
}
