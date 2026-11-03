// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Pantalla de la encuesta SUS (las afirmaciones y la escala están en susService).

const es = {
  title: 'Encuesta de usabilidad',
  thanks: 'Respuestas guardadas. ¡Gracias!',
  score: (n: number) => `Puntaje SUS: ${n}`,
  reference: (grade: string) => `${grade}. El promedio de referencia es 68.`,
  viewStats: 'Ver estadísticas',
  drillThanks: 'Gracias por hacer el simulacro. ',
  intro:
    'Indique qué tan de acuerdo está con cada afirmación (1 = totalmente en desacuerdo, 5 = totalmente de acuerdo). Las respuestas son anónimas y se guardan solo en este dispositivo.',
  item: (n: number) => `Afirmación ${n}`,
  disagree: 'Desacuerdo',
  agree: 'Acuerdo',
  submit: (done: number, total: number) => `Enviar respuestas (${done}/${total})`,
};

const en: typeof es = {
  title: 'Usability survey',
  thanks: 'Answers saved. Thank you!',
  score: (n: number) => `SUS score: ${n}`,
  reference: (grade: string) => `${grade}. The benchmark average is 68.`,
  viewStats: 'View statistics',
  drillThanks: 'Thank you for doing the drill. ',
  intro:
    'Indicate how much you agree with each statement (1 = strongly disagree, 5 = strongly agree). Answers are anonymous and stored only on this device.',
  item: (n: number) => `Statement ${n}`,
  disagree: 'Disagree',
  agree: 'Agree',
  submit: (done: number, total: number) => `Submit answers (${done}/${total})`,
};

export default { es, en };
