// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { devOrProd } from '../../utils/env';
// Pantalla de bienvenida.

const es = {
  tagline: 'Botón de pánico para emergencias sísmicas con alertas multicanal',
  features: {
    alert: 'Alerta local con señal sonora y visual',
    location: 'Ubicación del dispositivo, si usted la autoriza',
    contacts: 'Lista de contactos de confianza',
  },
  disclaimerPre: 'SISMO es una ',
  disclaimerTool: 'herramienta complementaria',
  disclaimerMid: '. No sustituye a los servicios oficiales de emergencia: ante una emergencia comuníquese con la ',
  disclaimerLine: 'línea {emergencyNumber}',
  disclaimerPost: '.',
  demoTitle: 'Modo de demostración',
  demoHint: 'Carga contactos e historial ficticios para explorar la app.',
  demoToggle: 'Cargar modo de demostración',
  start: 'Comenzar',
  foot: devOrProd('Prototipo académico · ', '') + 'Politécnico Grancolombiano',
};

const en: typeof es = {
  tagline: 'Panic button for earthquake emergencies with multichannel alerts',
  features: {
    alert: 'Local alert with sound and visual signal',
    location: 'Device location, if you allow it',
    contacts: 'List of trusted contacts',
  },
  disclaimerPre: 'SISMO is a ',
  disclaimerTool: 'complementary tool',
  disclaimerMid: '. It does not replace official emergency services: in an emergency, ',
  disclaimerLine: 'dial {emergencyNumber}',
  disclaimerPost: '.',
  demoTitle: 'Demo mode',
  demoHint: 'Loads fictitious contacts and history to explore the app.',
  demoToggle: 'Load demo mode',
  start: 'Get started',
  foot: devOrProd('Academic prototype · ', '') + 'Politécnico Grancolombiano',
};

export default { es, en };
