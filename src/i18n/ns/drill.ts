// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Pantalla de Simulacro.

const es = {
  title: 'Simulacro',
  howTitle: '¿Cómo funciona?',
  step1: 'Toque «Comenzar»: volverá al panel principal.',
  step2Before: 'Tras unos segundos aparecerá el aviso ',
  step2Signal: '«¡SISMO! Active la alerta ahora»',
  step2After: '.',
  step3: 'Toque SOS y confirme lo más rápido posible.',
  step4: 'La sirena, la linterna y la vibración se activan como en una emergencia real. Finalice la alerta al terminar.',
  step5: 'Al finalizar se abre la encuesta de usabilidad (SUS): son 10 preguntas rápidas.',
  saved: 'El resultado se guarda en el historial como simulacro y alimenta las estadísticas.',
  start: 'Comenzar simulacro',
  busy: 'Finalice la alerta activa antes de iniciar un simulacro.',
  lastTitle: 'Últimos simulacros',
  none: 'Aún no ha hecho simulacros.',
  reaction: (time: string) => `Reacción: ${time}`,
  early: 'Activó antes de la señal',
  stats: 'Estadísticas',
  survey: 'Encuesta SUS',
};

const en: typeof es = {
  title: 'Drill',
  howTitle: 'How does it work?',
  step1: 'Tap “Start”: you will return to the dashboard.',
  step2Before: 'After a few seconds the notice ',
  step2Signal: '“EARTHQUAKE! Activate the alert now”',
  step2After: ' will appear.',
  step3: 'Tap SOS and confirm as fast as you can.',
  step4: 'The siren, flashlight and vibration turn on as in a real emergency. End the alert when you are done.',
  step5: 'When it ends, the usability survey (SUS) opens: 10 quick questions.',
  saved: 'The result is saved in the history as a drill and feeds the statistics.',
  start: 'Start drill',
  busy: 'End the active alert before starting a drill.',
  lastTitle: 'Latest drills',
  none: 'You have not done any drills yet.',
  reaction: (time: string) => `Reaction: ${time}`,
  early: 'Activated before the signal',
  stats: 'Statistics',
  survey: 'SUS survey',
};

export default { es, en };
