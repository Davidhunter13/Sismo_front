// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Pantalla de Sismos recientes.

const es = {
  title: 'Sismos recientes',
  day: 'Últimas 24 h',
  week: 'Últimos 7 días',
  nearby: (km: number) => `Sismos de magnitud 2,5 o mayor a menos de ${km} km de su última ubicación.`,
  colombia: 'Sismos de magnitud 2,5 o mayor en Colombia. Registre su ubicación para ver los cercanos a usted.',
  loading: 'Consultando el catálogo del USGS…',
  error: 'No se pudo consultar. Revise su conexión.',
  empty: 'No hay sismos registrados en este periodo.',
  depth: (km: number) => ` · ${km} km de profundidad`,
  distance: (km: number) => ` · a ${km} km`,
  detail: 'Ver detalle en el USGS',
  refresh: 'Actualizar',
  sourceTitle: 'Fuente',
  source: [
    'Datos del Servicio Geológico de EE. UU. (USGS), catálogo público y gratuito. Pueden tardar unos minutos en aparecer.',
    'Para información oficial en Colombia consulte el Servicio Geológico Colombiano (sgc.gov.co).',
    'Su ubicación no se envía: se descarga el listado general y se filtra en este dispositivo.',
    'SISMO no detecta ni predice sismos.',
  ],
};

const en: typeof es = {
  title: 'Recent earthquakes',
  day: 'Last 24 h',
  week: 'Last 7 days',
  nearby: (km: number) => `Earthquakes of magnitude 2.5 or greater within ${km} km of your last location.`,
  colombia: 'Earthquakes of magnitude 2.5 or greater in Colombia. Save your location to see the ones near you.',
  loading: 'Querying the USGS catalog…',
  error: 'The query failed. Check your connection.',
  empty: 'No earthquakes recorded in this period.',
  depth: (km: number) => ` · ${km} km deep`,
  distance: (km: number) => ` · ${km} km away`,
  detail: 'View details on the USGS site',
  refresh: 'Refresh',
  sourceTitle: 'Source',
  source: [
    'Data from the U.S. Geological Survey (USGS), a free public catalog. Events may take a few minutes to appear.',
    'For official information in Colombia, check the Colombian Geological Survey (SGC, sgc.gov.co).',
    'Your location is not sent: the general list is downloaded and filtered on this device.',
    'SISMO does not detect or predict earthquakes.',
  ],
};

export default { es, en };
