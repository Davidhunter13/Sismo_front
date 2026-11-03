// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Etiquetas de dominio compartidas: tipos de evento, estados del canal digital y del permiso de ubicación.

const es = {
  eventType: { sismo: 'Sismo', emergencia_general: 'Otra emergencia', prueba: 'Prueba del sistema' },
  delivery: {
    pendiente: 'Pendiente',
    enviada: 'Enviada',
    fallida: 'Fallida',
    no_disponible: 'Sin canal digital',
    sms_abierto: 'SMS abierto',
  },
  permission: {
    concedido: 'Permiso concedido',
    denegado: 'Permiso denegado',
    no_disponible: 'No disponible',
    sin_solicitar: 'Sin solicitar',
  },
};

const en: typeof es = {
  eventType: { sismo: 'Earthquake', emergencia_general: 'Other emergency', prueba: 'System test' },
  delivery: {
    pendiente: 'Pending',
    enviada: 'Sent',
    fallida: 'Failed',
    no_disponible: 'No digital channel',
    sms_abierto: 'SMS opened',
  },
  permission: {
    concedido: 'Permission granted',
    denegado: 'Permission denied',
    no_disponible: 'Not available',
    sin_solicitar: 'Not requested',
  },
};

export default { es, en };
