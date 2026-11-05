// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Aviso de actualización de la app Android (versión sugerida u obligatoria).

const es = {
  suggestedTitle: 'Hay una versión nueva',
  suggestedText: (nombre: string) => (nombre ? `Ya está disponible SISMO ${nombre}, con mejoras y correcciones.` : 'Ya está disponible una versión nueva de SISMO, con mejoras y correcciones.'),
  requiredTitle: 'Actualice SISMO para seguir',
  requiredText: (nombre: string) =>
    `Esta versión ya no es compatible. Instale ${nombre ? `la versión ${nombre}` : 'la versión nueva'} para que sus alertas lleguen al centro de monitoreo.`,
  store: 'Abrir la tienda',
  apk: 'Descargar la nueva versión',
  apkHint: 'Se descarga el archivo APK. Ábralo y toque «Instalar»; sus datos se conservan.',
  later: 'Ahora no',
  emergency: 'Tengo una emergencia',
  emergencyHint: 'El botón de emergencia y la llamada siguen funcionando.',
  current: (nombre: string) => `Versión instalada: ${nombre}`,
};

const en: typeof es = {
  suggestedTitle: 'A new version is available',
  suggestedText: (nombre: string) => (nombre ? `SISMO ${nombre} is available, with improvements and fixes.` : 'A new version of SISMO is available, with improvements and fixes.'),
  requiredTitle: 'Update SISMO to continue',
  requiredText: (nombre: string) =>
    `This version is no longer supported. Install ${nombre ? `version ${nombre}` : 'the new version'} so your alerts reach the monitoring center.`,
  store: 'Open the store',
  apk: 'Download the new version',
  apkHint: 'The APK file will download. Open it and tap “Install”; your data is kept.',
  later: 'Not now',
  emergency: 'I have an emergency',
  emergencyHint: 'The emergency button and the call keep working.',
  current: (nombre: string) => `Installed version: ${nombre}`,
};

export default { es, en };
