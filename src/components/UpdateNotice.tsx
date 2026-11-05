// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { Download, ShieldAlert, Store } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { checkForUpdate, myVersionName, openUpdateLink, skipVersion, type UpdateState } from '../services/versionService';
import { canShowBadgeNotice } from '../utils/badgeGate';
import { goToRoot } from '../utils/navigation';

/** Cada cuánto se vuelve a consultar al regresar a la app. */
const RECHECK_MS = 60 * 60 * 1000;
/** «Tengo una emergencia» deja usar la app este tiempo antes de volver a pedir la actualización. */
const EMERGENCY_PAUSE_MS = 30 * 60 * 1000;

function root(): HTMLElement {
  let el = document.getElementById('update-notice-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'update-notice-root';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Aviso de actualización (solo app Android; ver versionService):
 *  - sugerida: diálogo con «Actualizar» y «Ahora no»;
 *  - obligatoria: pantalla completa que no deja seguir, con «Tengo una emergencia» que lleva a Inicio (botón de
 *    emergencia) y pausa el bloqueo 30 minutos.
 * Igual que el aviso de insignias, NUNCA aparece con una alerta activa, en la pantalla de alerta ni en un simulacro:
 * en una emergencia nada se interpone.
 */
export function UpdateNotice() {
  const t = useT().update;
  const { data, drill } = useAppState();
  const { pathname } = useLocation();
  const router = useIonRouter();
  const [state, setState] = useState<UpdateState>({ level: 'ok', version: null });
  const [closed, setClosed] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);
  const lastCheck = useRef(0);
  const actionRef = useRef<HTMLButtonElement>(null);

  const check = useCallback(() => {
    lastCheck.current = Date.now();
    void checkForUpdate().then((s) => {
      setState(s);
      setClosed(false);
    });
  }, []);

  useEffect(() => {
    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > RECHECK_MS) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  const v = state.version;
  const allowed = canShowBadgeNotice({ activeAlertId: data.activeAlertId, pathname, drillActive: drill !== null });
  const show =
    v !== null && allowed && !closed &&
    (state.level === 'sugerida' || (state.level === 'obligatoria' && Date.now() >= pausedUntil));

  useEffect(() => {
    if (show) actionRef.current?.focus();
  }, [show]);

  // La pausa de emergencia vence sola: se fuerza un repintado al terminar.
  useEffect(() => {
    if (!pausedUntil) return;
    const id = setTimeout(() => setPausedUntil(0), Math.max(0, pausedUntil - Date.now()));
    return () => clearTimeout(id);
  }, [pausedUntil]);

  if (!show || !v) return null;

  const Icon = v.tienda ? Store : Download;
  const action = (
    <button ref={actionRef} className="btn btn--primary btn--block btn--lg" onClick={() => openUpdateLink(v)}>
      <Icon size={20} aria-hidden="true" /> {v.tienda ? t.store : t.apk}
    </button>
  );
  const installed = myVersionName();

  if (state.level === 'obligatoria') {
    return createPortal(
      <div className="update-blocker" role="alertdialog" aria-modal="true" aria-labelledby="update-title" aria-describedby="update-desc">
        <Download className="update-notice__icon" size={40} aria-hidden="true" />
        <h2 id="update-title">{t.requiredTitle}</h2>
        <p id="update-desc">{t.requiredText(v.nombre)}</p>
        <div className="update-blocker__actions">
          {action}
          {!v.tienda && <p className="update-notice__hint">{t.apkHint}</p>}
          {installed && <p className="update-notice__hint">{t.current(installed)}</p>}
        </div>
        <div className="update-blocker__sos">
          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              setPausedUntil(Date.now() + EMERGENCY_PAUSE_MS);
              goToRoot(router, '/inicio');
            }}
          >
            <ShieldAlert size={20} aria-hidden="true" /> {t.emergency}
          </button>
          <p className="update-notice__hint">{t.emergencyHint}</p>
        </div>
      </div>,
      root(),
    );
  }

  return createPortal(
    <div className="badge-notice-backdrop">
      <div className="badge-notice" role="dialog" aria-modal="true" aria-labelledby="update-title" aria-describedby="update-desc">
        <Download className="update-notice__icon" size={30} aria-hidden="true" />
        <h2 id="update-title">{t.suggestedTitle}</h2>
        <p className="badge-notice__desc" id="update-desc">{t.suggestedText(v.nombre)}</p>
        {!v.tienda && <p className="update-notice__hint">{t.apkHint}</p>}
        <div className="badge-notice__actions">
          {action}
          <button
            className="btn btn--outline btn--block"
            onClick={() => {
              skipVersion(v.actual);
              setClosed(true);
            }}
          >
            {t.later}
          </button>
        </div>
      </div>
    </div>,
    root(),
  );
}
