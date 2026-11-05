// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { ChevronRight, UserCheck } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { hasPhoto, photoSnapshot, subscribePhoto } from '../services/photoService';
import { goToRoot } from '../utils/navigation';
import { PROFILE_ROUTES, profileCompletion } from '../utils/profileCompletion';

const ROOT_PATHS = new Set(['/contactos', '/ubicacion']);

/** «Perfil completado» en Inicio: se calcula en el teléfono (cambia al instante) con los 7 puntos del servidor. */
export function ProfileCompletionCard() {
  const router = useIonRouter();
  const t = useT().badges.profile;
  const { data } = useAppState();
  useSyncExternalStore(subscribePhoto, photoSnapshot);
  const p = profileCompletion(data, hasPhoto());
  const go = (path: string) => (ROOT_PATHS.has(path) ? goToRoot(router, path) : router.push(path, 'forward'));

  return (
    <section className="card stack profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card__head">
        <h2 className="card__title" id="profile-card-title"><UserCheck size={18} aria-hidden="true" /> {t.title}</h2>
        <strong className="profile-card__pct">{p.porcentaje} %</strong>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.porcentaje} aria-label={t.percentAria(p.porcentaje)}>
        <span style={{ width: `${p.porcentaje}%` }} />
      </div>
      {p.missing.length === 0 ? (
        <p className="small">{t.complete}</p>
      ) : (
        <>
          <p className="small muted">{t.missing}</p>
          <ul className="profile-card__missing">
            {p.missing.map((item) => (
              <li key={item}>
                <button className="link-row" onClick={() => go(PROFILE_ROUTES[item])}>
                  <span>{t.items[item]}</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
