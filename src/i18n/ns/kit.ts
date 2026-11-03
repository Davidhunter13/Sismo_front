// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Mochila de emergencia.

const es = {
  title: 'Mochila de emergencia',
  reviewedToast: 'Revisión registrada. Le recordaremos en 6 meses.',
  expired: 'Vencido',
  expiresIn: (d: number) => `Vence en ${d} día(s)`,
  expiresOn: (date: string) => `Vence: ${date}`,
  stats: { ready: 'Listos', expired: 'Vencidos', expiringSoon: 'Por vencer' },
  replace: (names: string) => `Revise y reemplace: ${names}.`,
  reviewTitle: 'Revisión periódica',
  lastReview: (date: string) => `Última revisión: ${date}.`,
  noReview: 'Aún no ha registrado una revisión.',
  reviewDue: (months: number) => ` Se recomienda revisarla cada ${months} meses: es momento de hacerlo.`,
  markReviewed: 'Marcar revisada hoy',
  itemsTitle: 'Elementos',
  expiryLabel: 'Vencimiento',
  remove: (name: string) => `Quitar ${name}`,
  addItem: 'Agregar elemento',
  footnote: 'Lista orientativa. Valídela con las recomendaciones oficiales de gestión del riesgo (UNGRD).',
};

const en: typeof es = {
  title: 'Emergency kit',
  reviewedToast: 'Review recorded. We will remind you in 6 months.',
  expired: 'Expired',
  expiresIn: (d: number) => `Expires in ${d} day(s)`,
  expiresOn: (date: string) => `Expires: ${date}`,
  stats: { ready: 'Ready', expired: 'Expired', expiringSoon: 'Expiring soon' },
  replace: (names: string) => `Check and replace: ${names}.`,
  reviewTitle: 'Periodic review',
  lastReview: (date: string) => `Last review: ${date}.`,
  noReview: 'You have not recorded a review yet.',
  reviewDue: (months: number) => ` We recommend reviewing it every ${months} months: it is time to do it.`,
  markReviewed: 'Mark as reviewed today',
  itemsTitle: 'Items',
  expiryLabel: 'Expiration date',
  remove: (name: string) => `Remove ${name}`,
  addItem: 'Add item',
  footnote: 'Guidance list. Check it against the official risk management recommendations (UNGRD).',
};

export default { es, en };
