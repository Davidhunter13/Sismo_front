// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useT } from '../i18n/useT';
import { ensureFirstRefresh } from '../services/catalogService';
import { isLoading, subscribeLoader } from '../services/loaderService';

/**
 * Indicadores de carga con la identidad de SISMO (anillo rojo + onda sísmica):
 * - SplashScreen: al abrir la app, breve (mín. 0,6 s, máx. 1,5 s) mientras se intenta descargar los catálogos.
 *   Nunca espera a la red más que eso y NO se muestra si la app se abre para una alerta (widget, acceso rápido o
 *   alerta activa): el SOS jamás queda tapado.
 * - RequestOverlay + withLoader() (services/loaderService): pantalla oscura translúcida durante las solicitudes que inicia la persona
 *   (código de recuperación, recuperar datos, buscar dirección, sismos recientes). La sincronización automática
 *   no lo usa: sigue en silencio.
 */

const SPLASH_MIN_MS = 600;
const SPLASH_MAX_MS = 1500;

function LoaderMark() {
  return (
    <svg className="app-loader__mark" width="88" height="88" viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="5" />
      <circle className="app-loader__arc" cx="48" cy="48" r="42" fill="none" stroke="#D62828" strokeWidth="5" strokeLinecap="round" strokeDasharray="70 194" />
      <path className="app-loader__wave" d="M22 50h11l5-12 7 22 6-16 4 6h19" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Loader de solicitudes (se monta una vez en la raíz de la app). */
export function RequestOverlay() {
  const t = useT().common.loader;
  const busy = useSyncExternalStore(subscribeLoader, isLoading);
  if (!busy) return null;
  return (
    <div className="app-loader app-loader--overlay" role="status" aria-live="polite">
      <LoaderMark />
      <span className="app-loader__text">{t.working}</span>
    </div>
  );
}

/** Pantalla de carga al abrir la app. `skip`: la app se abrió para una alerta. */
export function SplashScreen({ skip }: { skip: boolean }) {
  const t = useT().common.loader;
  const [state, setState] = useState<'visible' | 'saliendo' | 'oculta'>(skip ? 'oculta' : 'visible');

  useEffect(() => {
    if (skip) return;
    let done = false;
    const start = Date.now();
    const finish = () => {
      if (done) return;
      done = true;
      window.setTimeout(() => setState('saliendo'), Math.max(0, SPLASH_MIN_MS - (Date.now() - start)));
    };
    const max = window.setTimeout(finish, SPLASH_MAX_MS);
    void ensureFirstRefresh().finally(finish);
    return () => window.clearTimeout(max);
  }, [skip]);

  useEffect(() => {
    if (state !== 'saliendo') return;
    const timer = window.setTimeout(() => setState('oculta'), 250);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === 'oculta') return null;
  return (
    <div className={`app-loader app-loader--splash${state === 'saliendo' ? ' app-loader--out' : ''}`} role="status" aria-live="polite">
      <LoaderMark />
      <strong className="app-loader__brand">SISMO</strong>
      <span className="app-loader__text">{t.loading}</span>
    </div>
  );
}
