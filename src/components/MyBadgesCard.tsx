// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { Award, ChevronRight } from 'lucide-react';
import { useT } from '../i18n/useT';
import { useSyncExternalStore } from 'react';
import { badgesVersion, closestPending, latestEarned, newBadgeIds, subscribeBadges } from '../services/badgeService';
import { BadgeArt } from './BadgeArt';
import { useBadges } from './useBadges';

/** «Mis insignias» en Inicio: la última ganada y la más cercana a ganar; lleva a la página de insignias. */
export function MyBadgesCard() {
  const router = useIonRouter();
  const t = useT().badges;
  const { data, enabled } = useBadges();
  useSyncExternalStore(subscribeBadges, badgesVersion);
  const ids = newBadgeIds();
  const sinVer = (data?.ganadas ?? []).filter((b) => ids.includes(String(b.id))).length;
  if (!enabled) return null;
  const latest = latestEarned(data);
  const closest = closestPending(data);
  const pct = closest && closest.requerido > 0 ? Math.min(100, Math.round((closest.avance / closest.requerido) * 100)) : 0;

  return (
    <section className="card stack my-badges-card" aria-labelledby="my-badges-title">
      <div className="profile-card__head">
        <h2 className="card__title" id="my-badges-title"><Award size={18} aria-hidden="true" /> {t.card.title}{sinVer > 0 && <span className="new-dot" aria-label={t.newCount(sinVer)}>{sinVer}</span>}</h2>
        {data && data.total > 0 && <span className="small muted">{t.card.count(data.ganadas.length, data.total)}</span>}
      </div>
      {latest ? (
        <div className="badge-line">
          <BadgeArt level={latest.nivel} image={latest.imagen} size="sm" />
          <div>
            <small className="muted">{t.card.latest}</small>
            <strong>{latest.nombre}</strong>
          </div>
        </div>
      ) : (
        <p className="small muted">{t.card.none}</p>
      )}
      {closest && (
        <div className="badge-line">
          <BadgeArt level={closest.nivel} image={closest.imagen} size="sm" dim />
          <div className="badge-line__grow">
            <small className="muted">{t.card.closest}</small>
            <strong>{closest.nombre}</strong>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={closest.requerido} aria-valuenow={closest.avance} aria-label={t.progress(closest.avance, closest.requerido)}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <small className="muted">{t.progress(closest.avance, closest.requerido)}</small>
          </div>
        </div>
      )}
      <button className="btn btn--outline btn--block" onClick={() => router.push('/insignias', 'forward')}>
        {t.card.cta} <ChevronRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
