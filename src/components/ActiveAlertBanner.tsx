// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { ChevronRight, Siren } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { formatDuration } from '../utils/format';

/**
 * Aviso fijo arriba de cualquier pantalla mientras hay una alerta SOS activa (la alerta sigue corriendo aunque la
 * persona se mueva a Ubicación, Configuración, etc.). Tocarlo vuelve a la pantalla de alerta. No se muestra en ella.
 */
export function ActiveAlertBanner() {
  const { activeAlert } = useAppState();
  const t = useT().alert.activeBanner;
  const router = useIonRouter();
  const { pathname } = useLocation();
  // Refresca el tiempo transcurrido cada 15 s mientras se ve.
  const [, tick] = useState(0);
  const visible = !!activeAlert && pathname !== '/alerta';
  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => tick((n) => n + 1), 15_000);
    return () => window.clearInterval(id);
  }, [visible]);
  if (!activeAlert || pathname === '/alerta') return null;
  return (
    <button type="button" className={`active-alert-banner${activeAlert.isDrill ? ' active-alert-banner--drill' : ''}`}
      onClick={() => router.push('/alerta', 'forward')} aria-label={`${activeAlert.isDrill ? t.drill : t.title}. ${t.action}`}>
      <Siren size={20} aria-hidden="true" className="active-alert-banner__icon" />
      <span className="active-alert-banner__text">
        <strong>{activeAlert.isDrill ? t.drill : t.title}</strong>
        <small>{t.since(formatDuration(activeAlert.activatedAt))} · {t.action}</small>
      </span>
      <ChevronRight size={20} aria-hidden="true" />
    </button>
  );
}
