// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Asistente de registro obligatorio (sin modo de demostración).

const es = {
  title: 'Registro',
  intro: 'Complete estos 4 pasos para que SISMO pueda avisar a sus contactos. Todos son obligatorios.',
  stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
  steps: { name: 'Su nombre', location: 'Ubicación actual', meeting: 'Punto de encuentro', contact: 'Contacto de confianza' },
  nameHint: 'Aparece en los mensajes que reciben sus contactos.',
  locationHint: 'Autorice la ubicación del dispositivo. Se usa para el enlace de los mensajes y para la ruta al punto de encuentro.',
  locationButton: 'Obtener mi ubicación',
  locationOk: 'Ubicación obtenida.',
  locationMissing: 'Todavía no hay ubicación del dispositivo. Si el navegador la bloqueó, permítala en la configuración del sitio y vuelva a intentarlo.',
  meetingHint: 'El lugar donde su familia acordó reunirse después de un sismo. Use su ubicación actual o busque una dirección.',
  meetingSaved: (label: string) => `Guardado: ${label}`,
  contactHint: 'Agregue al menos una persona real (nombre, teléfono y correo). Recibirá el aviso de alerta y el «Estoy bien».',
  contactAdd: 'Agregar contacto',
  contactCount: (n: number) => (n === 1 ? '1 contacto agregado.' : `${n} contactos agregados.`),
  back: 'Atrás',
  next: 'Siguiente',
  finish: 'Finalizar registro',
  sos: 'SOS · Emergencia ahora',
  sosHint: 'Si es una emergencia, no espere a terminar el registro.',
};

const en: typeof es = {
  title: 'Sign-up',
  intro: 'Complete these 4 steps so SISMO can notify your contacts. All of them are required.',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  steps: { name: 'Your name', location: 'Current location', meeting: 'Meeting point', contact: 'Trusted contact' },
  nameHint: 'It appears in the messages your contacts receive.',
  locationHint: 'Allow device location. It is used for the link in the messages and for the route to the meeting point.',
  locationButton: 'Get my location',
  locationOk: 'Location obtained.',
  locationMissing: 'There is no device location yet. If the browser blocked it, allow it in the site settings and try again.',
  meetingHint: 'The place where your family agreed to meet after an earthquake. Use your current location or search for an address.',
  meetingSaved: (label: string) => `Saved: ${label}`,
  contactHint: 'Add at least one real person (name, phone and email). They will receive the alert and the "I\'m OK" message.',
  contactAdd: 'Add contact',
  contactCount: (n: number) => (n === 1 ? '1 contact added.' : `${n} contacts added.`),
  back: 'Back',
  next: 'Next',
  finish: 'Finish sign-up',
  sos: 'SOS · Emergency now',
  sosHint: 'If this is an emergency, do not wait to finish signing up.',
};

export default { es, en };
