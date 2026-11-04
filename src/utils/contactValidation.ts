// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getT } from '../i18n';
import { getCatalogs } from '../services/catalogService';
import type { ContactInput } from '../types';

/** Claves de parentesco (catálogo administrable). Se guarda la clave; la interfaz muestra su etiqueta. */
export const relationshipIds = (): string[] => getCatalogs().relationships.map((r) => r.id);

type Errors = Partial<Record<keyof ContactInput, string>>;

/** Reglas de validación del formulario de contacto. Los mensajes salen en el idioma activo. */
export function validateContact(input: ContactInput): Errors {
  const t = getT().services.validation;
  const errors: Errors = {};
  const name = input.name.trim();
  if (name.length < 2) errors.name = t.nameTooShort;
  else if (name.length > 50) errors.name = t.nameTooLong;
  else if (!/^[\p{L}\s.'()-]+$/u.test(name)) errors.name = t.nameChars;

  // Un contacto antiguo puede tener un parentesco que ya no está en el catálogo: se acepta tal cual.
  const rel = input.relationship.trim();
  if (!rel || rel.length > 60) errors.relationship = t.relationship;

  const digits = input.phone.replace(/[\s()-]/g, '');
  if (!digits) errors.phone = t.phoneRequired;
  else if (!/^\+?\d{7,15}$/.test(digits)) errors.phone = t.phoneFormat;

  // Obligatorio: es el destino del correo de alerta.
  const email = input.email.trim();
  if (!email) errors.email = t.emailRequired;
  else if (email.length > 120 || !EMAIL_RE.test(email)) errors.email = t.emailFormat;
  return errors;
}

/** Validación práctica de correo (usuario@dominio.tld); la definitiva la hace el servidor al enviar. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
