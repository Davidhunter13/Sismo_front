// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { ContactInput } from '../types';

export const RELATIONSHIPS = ['Familiar', 'Pareja', 'Amigo/a', 'Vecino/a', 'Compañero/a de trabajo', 'Otro'];

type Errors = Partial<Record<keyof ContactInput, string>>;

/** Reglas de validación del formulario de contacto. */
export function validateContact(input: ContactInput): Errors {
  const errors: Errors = {};
  const name = input.name.trim();
  if (name.length < 2) errors.name = 'Ingrese al menos 2 caracteres.';
  else if (name.length > 50) errors.name = 'Máximo 50 caracteres.';
  else if (!/^[\p{L}\s.'()-]+$/u.test(name)) errors.name = 'Use solo letras, espacios y . \' ( ) -';

  if (!RELATIONSHIPS.includes(input.relationship)) errors.relationship = 'Seleccione una relación.';

  const digits = input.phone.replace(/[\s()-]/g, '');
  if (!digits) errors.phone = 'El teléfono es obligatorio.';
  else if (!/^\+?\d{7,15}$/.test(digits)) errors.phone = 'Entre 7 y 15 dígitos; puede iniciar con +.';
  return errors;
}
