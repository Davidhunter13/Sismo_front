// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { LifeBuoy, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useT } from '../i18n/useT';
import { fetchHelpStatus, syncEnabled, type HelpStatus } from '../services/syncService';
import { RichText } from './RichText';

/** Cada cuánto se consulta si el centro de monitoreo registró ayuda para la alerta. */
const HELP_POLL_MS = 15_000;

/**
 * Aviso en la pantalla de alerta cuando el centro de monitoreo de SISMO (panel administrativo) registra ayuda:
 * «en atención», «ayuda enviada» o «resuelta», con su mensaje (con el formato del editor del panel: negrilla,
 * cursiva, subrayado, tachado y listas). Sin servidor o sin red no muestra nada.
 * - Cada actualización nueva aparece como una alerta FIJA arriba de la pantalla (se ve sin importar el scroll)
 *   y se cierra tocándola. Solo vuelve a aparecer si llega otra actualización (otro estado o mensaje).
 * - Además queda el recuadro dentro de la pantalla como registro.
 */
export function HelpStatusBanner({ alertId }: { alertId: string }) {
  const t = useT().alert.help;
  const [help, setHelp] = useState<HelpStatus | null>(null);

  useEffect(() => {
    if (!syncEnabled()) return;
    let cancelled = false;
    const check = async () => {
      const result = await fetchHelpStatus();
      if (!cancelled) setHelp(result && result.alertId === alertId ? result : null);
    };
    void check();
    const timer = window.setInterval(() => void check(), HELP_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [alertId]);

  // Clave de la actualización: si cambia el estado, el mensaje o la hora, es una novedad y se vuelve a mostrar.
  const key = help ? `${help.alertId}|${help.status}|${help.at}|${help.note}` : '';
  const [dismissed, setDismissed] = useState<string>(() => readDismissed());
  const close = () => {
    setDismissed(key);
    writeDismissed(key);
  };

  if (!help) return null;
  const tone = help.status === 'resuelta' ? 'help-toast--ok' : help.status === 'ayuda_enviada' ? 'help-toast--sent' : '';
  const toast = key !== dismissed
    ? createPortal(
      <div className={`help-toast ${tone}`} role="alert" aria-live="assertive" onClick={close}>
        <LifeBuoy size={24} aria-hidden="true" className="help-toast__icon" />
        <div className="help-toast__body">
          <small className="help-toast__title">{t.title}</small>
          <strong>{t[help.status]}</strong>
          {help.note && <div className="help-toast__note"><small className="help-toast__label">{t.note}</small><RichText html={help.note} /></div>}
          <small className="help-toast__hint">{t.tapToClose}</small>
        </div>
        <button type="button" className="help-toast__close" aria-label={t.dismiss} onClick={(e) => { e.stopPropagation(); close(); }}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      {toast}
    <div className={`callout callout--row ${help.status === 'resuelta' ? 'callout--info' : 'callout--warning'}`} role="status" aria-live="polite">
      <LifeBuoy size={20} aria-hidden="true" />
      <div>
        <strong>{t[help.status]}</strong>
        {help.note && <div className="small help-note"><span className="muted">{t.note}:</span> <RichText html={help.note} /></div>}
      </div>
    </div>
    </>
  );
}

const DISMISSED_KEY = 'sismo:v1:ayuda_cerrada';
function readDismissed(): string {
  try {
    return localStorage.getItem(DISMISSED_KEY) ?? '';
  } catch {
    return '';
  }
}
function writeDismissed(value: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY, value);
  } catch {
    // Sin almacenamiento: se recuerda solo mientras la pantalla esté abierta.
  }
}
