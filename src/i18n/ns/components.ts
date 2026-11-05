// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Componentes compartidos: tarjetas de estado, mapas, insignias, botón de pánico, detector de caídas y logotipo.

const es = {
  sync: {
    offlineTitle: 'Sin conexión.',
    offline: 'Sus datos se guardan en el teléfono y se subirán apenas haya conexión.',
    serverTitle: 'Sin conexión con el servidor.',
    server: 'Sus datos están guardados en el teléfono y se subirán solos apenas se restablezca.',
    pending: (n: number) => (n === 1 ? '1 cambio pendiente.' : `${n} cambios pendientes.`),
  },
  alertStatus: {
    noneTitle: 'Sin alertas activas',
    noneText: 'Mantenga la calma. Pulse el botón SOS solo si necesita ayuda.',
    normal: 'Normal',
    ongoing: (label: string) => `${label}: alerta en curso`,
    activatedAt: (time: string) => `Activada a las ${time}. Toque para ver detalles.`,
  },
  fall: {
    title: '¿Está bien?',
    desc: 'Detectamos una caída o un impacto fuerte. Si no responde, se activará la alerta en',
    seconds: (n: number) => `${n} s`,
    ok: 'Estoy bien',
    help: 'Pedir ayuda ahora',
  },
  locationCard: {
    titleCompact: 'Ubicación',
    title: 'Estado de la ubicación',
    testCoords: 'Coordenadas de prueba',
    testText: 'No corresponden a su posición actual. Se usan solo para pruebas.',
    device: 'Ubicación del dispositivo',
    latitude: 'Latitud',
    longitude: 'Longitud',
    accuracy: 'Precisión',
    notApplicable: 'No aplica',
    recorded: 'Registrada',
    none: 'No hay ubicación registrada.',
    noneCompact: 'Puede solicitarla en la sección Ubicación.',
    noneFull: 'Solicítela con el botón inferior.',
  },
  map: {
    schematicLabel: 'Representación esquemática de la ubicación',
    noLocation: 'Sin ubicación',
    testPrefix: 'Prueba · ',
    noData: 'Esquema sin datos',
    notReal: ' · Esquema, no es un mapa real',
    realLabel: 'Mapa real de la ubicación',
    meetingPoint: (label: string) => `Punto de encuentro: ${label}`,
    accuracy: (m: number) => ` · Precisión ±${m} m`,
    tilesFailed: 'No se pudo cargar el mapa: revise la conexión a internet o si una extensión del navegador bloquea OpenStreetMap. La ubicación y la brújula siguen funcionando.',
    lowAccuracy:
      'Ubicación aproximada: este dispositivo no usó GPS (en computadores se estima por WiFi o IP). La posición real puede estar en cualquier punto del círculo. En el celular será más precisa.',
  },
  badge: {
    activeAlert: 'Alerta activa',
    local: 'Activada localmente',
    demo: 'Demostración',
  },
  panic: {
    viewActive: 'Ver alerta activa',
    activate: 'Activar alerta de emergencia',
    active: 'ALERTA ACTIVA',
    sos: 'SOS',
    tapToView: 'Toque para ver',
    pressToActivate: 'Pulse para activar',
  },
  logo: 'Logotipo de SISMO',
  instruction: {
    stop: (title: string) => `Detener lectura de ${title}`,
    listen: (title: string) => `Escuchar ${title}`,
  },
};

const en: typeof es = {
  sync: {
    offlineTitle: 'No connection.',
    offline: 'Your data is saved on the phone and will upload as soon as you are back online.',
    serverTitle: 'Cannot reach the server.',
    server: 'Your data is saved on the phone and will upload automatically as soon as the connection is restored.',
    pending: (n: number) => (n === 1 ? '1 pending change.' : `${n} pending changes.`),
  },
  alertStatus: {
    noneTitle: 'No active alerts',
    noneText: 'Stay calm. Press the SOS button only if you need help.',
    normal: 'Normal',
    ongoing: (label: string) => `${label}: alert in progress`,
    activatedAt: (time: string) => `Started at ${time}. Tap to see details.`,
  },
  fall: {
    title: 'Are you OK?',
    desc: 'We detected a fall or a strong impact. If you do not respond, the alert will start in',
    seconds: (n: number) => `${n} s`,
    ok: 'I am OK',
    help: 'Ask for help now',
  },
  locationCard: {
    titleCompact: 'Location',
    title: 'Location status',
    testCoords: 'Test coordinates',
    testText: 'They do not match your current position. They are only used for testing.',
    device: 'Device location',
    latitude: 'Latitude',
    longitude: 'Longitude',
    accuracy: 'Accuracy',
    notApplicable: 'N/A',
    recorded: 'Recorded',
    none: 'No location recorded.',
    noneCompact: 'You can request it in the Location section.',
    noneFull: 'Request it with the button below.',
  },
  map: {
    schematicLabel: 'Schematic representation of the location',
    noLocation: 'No location',
    testPrefix: 'Test · ',
    noData: 'Diagram without data',
    notReal: ' · Diagram, not a real map',
    realLabel: 'Real map of the location',
    meetingPoint: (label: string) => `Meeting point: ${label}`,
    accuracy: (m: number) => ` · Accuracy ±${m} m`,
    tilesFailed: 'The map could not load: check your internet connection or whether a browser extension blocks OpenStreetMap. Location and the compass still work.',
    lowAccuracy:
      'Approximate location: this device did not use GPS (on computers it is estimated from WiFi or IP). Your real position may be anywhere inside the circle. It will be more accurate on a phone.',
  },
  badge: {
    activeAlert: 'Active alert',
    local: 'Activated locally',
    demo: 'Demo',
  },
  panic: {
    viewActive: 'View active alert',
    activate: 'Start emergency alert',
    active: 'ACTIVE ALERT',
    sos: 'SOS',
    tapToView: 'Tap to view',
    pressToActivate: 'Press to activate',
  },
  logo: 'SISMO logo',
  instruction: {
    stop: (title: string) => `Stop reading ${title}`,
    listen: (title: string) => `Listen to ${title}`,
  },
};

export default { es, en };
