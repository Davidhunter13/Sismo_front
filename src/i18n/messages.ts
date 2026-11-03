// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import alert from './ns/alert';
import common from './ns/common';
import components from './ns/components';
import contacts from './ns/contacts';
import drill from './ns/drill';
import features from './ns/features';
import guide from './ns/guide';
import history from './ns/history';
import home from './ns/home';
import kit from './ns/kit';
import labels from './ns/labels';
import location from './ns/location';
import medical from './ns/medical';
import quakes from './ns/quakes';
import services from './ns/services';
import settings from './ns/settings';
import stats from './ns/stats';
import survey from './ns/survey';
import welcome from './ns/welcome';

/** Registro de espacios de nombres. Al crear uno nuevo en ns/, agréguelo aquí. */
export const messages = {
  alert,
  common,
  components,
  contacts,
  drill,
  features,
  guide,
  history,
  home,
  kit,
  labels,
  location,
  medical,
  quakes,
  services,
  settings,
  stats,
  survey,
  welcome,
};

export type Messages = { [K in keyof typeof messages]: (typeof messages)[K]['es'] };
