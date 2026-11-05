// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Asistente de registro obligatorio (sin modo de demostración).

const es = {
  title: 'Registro',
  intro: 'Complete estos pasos para que SISMO pueda avisar a sus contactos. Los 4 primeros son obligatorios; el último es opcional.',
  signalsTitle: 'Señales durante la alerta',
  stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
  steps: { name: 'Su nombre', location: 'Ubicación actual', meeting: 'Punto de encuentro', contact: 'Contacto de confianza', protection: 'Protección' },
  protectionHint: 'Elija qué quiere dejar activo durante una alerta. Puede dejar todo como está.',
  protectionLater: 'Puede cambiar estas opciones cuando quiera en Configuración.',
  nameHint: 'Aparece en los mensajes que reciben sus contactos.',
  locationHint: 'Autorice la ubicación del dispositivo. Se usa para el enlace de los mensajes y para la ruta al punto de encuentro.',
  locationButton: 'Obtener mi ubicación',
  locationOk: 'Ubicación obtenida.',
  locationMissing: 'Todavía no hay ubicación del dispositivo. Si el navegador la bloqueó, permítala en la configuración del sitio y vuelva a intentarlo.',
  meetingHint: 'El lugar donde su familia acordó reunirse después de un sismo. Use su ubicación actual o busque una dirección.',
  meetingSaved: (labels: string) => `Guardado: ${labels}. Puede agregar otro (trabajo, colegio…).`,
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
  intro: 'Complete these steps so SISMO can notify your contacts. The first 4 are required; the last one is optional.',
  signalsTitle: 'Signals during the alert',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  steps: { name: 'Your name', location: 'Current location', meeting: 'Meeting point', contact: 'Trusted contact', protection: 'Protection' },
  protectionHint: 'Choose what you want turned on during an alert. You can leave everything as it is.',
  protectionLater: 'You can change these options at any time in Settings.',
  nameHint: 'It appears in the messages your contacts receive.',
  locationHint: 'Allow device location. It is used for the link in the messages and for the route to the meeting point.',
  locationButton: 'Get my location',
  locationOk: 'Location obtained.',
  locationMissing: 'There is no device location yet. If the browser blocked it, allow it in the site settings and try again.',
  meetingHint: 'The place where your family agreed to meet after an earthquake. Use your current location or search for an address.',
  meetingSaved: (labels: string) => `Saved: ${labels}. You can add another one (work, school…).`,
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
