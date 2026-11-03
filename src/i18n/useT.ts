// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useAppState } from '../context/appContext';
import { getT } from './index';

/** Textos del idioma elegido en Configuración; el componente se vuelve a dibujar al cambiarlo. */
export function useT() {
  const { data } = useAppState();
  return getT(data.settings.language);
}
