// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { PartyPopper } from 'lucide-react';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation } from 'react-router-dom';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { badgesVersion, dismissNotice, markAllNoticesAsNew, pendingNotices, subscribeBadges } from '../services/badgeService';
import { nextBadgeNotice } from '../utils/badgeGate';
import { BadgeArt, LevelTag } from './BadgeArt';

/**
 * Aviso «¡Ganaste una insignia!»: muestra una a la vez las insignias nuevas en cola.
 * NUNCA aparece con una alerta activa, en la pantalla de alerta ni durante un simulacro (ver badgeGate): si llega
 * una insignia en ese momento queda en cola y se muestra cuando la alerta termina. Si el aviso está abierto y se
 * activa una alerta, desaparece sin descartarse. Solo se cierra con sus botones.
 *
 * «Ver mis insignias» lleva a la página y cierra TODOS los avisos en cola: quedan con la marca «Nueva» en la lista
 * hasta que se vean. Si la persona ya está en Mis insignias, los avisos no se muestran: pasan directo a «Nueva».
 *
 * Es un diálogo propio (no IonModal): un IonModal abierto desde el primer render a veces no se presentaba.
 * Se pinta en document.body (portal): dentro de las vistas de Ionic (con transform) el position: fixed quedaba
 * relativo a la página y el aviso no salía centrado en la pantalla.
 */
/**
 * Contenedor propio en <body> para el portal. Pintar el portal directamente en document.body chocaba con los
 * overlays de Ionic (ion-alert también se agrega a body): React fallaba con «removeChild … not a child» al cerrar
 * el diálogo de finalizar alerta y la app mostraba la pantalla de error.
 */
function noticeRoot(): HTMLElement {
  let el = document.getElementById('badge-notice-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'badge-notice-root';
    document.body.appendChild(el);
  }
  return el;
}

export function BadgeCelebration() {
  const t = useT().badges.notice;
  const { data, drill } = useAppState();
  const { pathname } = useLocation();
  const history = useHistory();
  const enInsignias = pathname === '/insignias';
  useSyncExternalStore(subscribeBadges, badgesVersion);
  const queue = pendingNotices();
  const current = enInsignias ? null : nextBadgeNotice(queue, { activeAlertId: data.activeAlertId, pathname, drillActive: drill !== null });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentId = current?.id;

  // Ya está viendo sus insignias: lo que esperaba aviso queda marcado como «Nueva» en la lista.
  const pendientes = queue.length;
  useEffect(() => {
    if (enInsignias && pendientes > 0) markAllNoticesAsNew();
  }, [enInsignias, pendientes]);

  // Foco en el botón al abrir (teclado y lectores de pantalla).
  useEffect(() => {
    if (currentId !== undefined) buttonRef.current?.focus();
  }, [currentId]);

  if (!current) return null;

  return createPortal(
    <div className="badge-notice-backdrop">
      <div className="badge-notice" role="dialog" aria-modal="true" aria-labelledby="badge-notice-title" aria-describedby="badge-notice-desc">
        <PartyPopper className="badge-notice__icon" size={28} aria-hidden="true" />
        <h2 id="badge-notice-title">{t.title}</h2>
        <BadgeArt level={current.nivel} image={current.imagen} size="lg" />
        <LevelTag level={current.nivel} />
        <h3 className="badge-notice__name">{current.nombre}</h3>
        <p className="badge-notice__desc" id="badge-notice-desc">{current.descripcion}</p>
        {queue.length > 1 && <p className="small muted">{t.more(queue.length - 1)}</p>}
        <div className="badge-notice__actions">
          <button ref={buttonRef} className="btn btn--primary btn--block" onClick={() => dismissNotice(current.id)}>
            {queue.length > 1 ? t.next : t.close}
          </button>
          <button
            className="btn btn--outline btn--block"
            onClick={() => {
              markAllNoticesAsNew();
              history.push('/insignias');
            }}
          >
            {t.view}
          </button>
        </div>
      </div>
    </div>,
    noticeRoot(),
  );
}
