// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton, useIonViewDidEnter } from '@ionic/react';
import { CalendarClock, Hourglass, Lock, RefreshCw, RotateCcw, WifiOff } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Avatar } from '../components/Avatar';
import { BadgeArt, LevelTag } from '../components/BadgeArt';
import { useBadges } from '../components/useBadges';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { badgesVersion, markSeen, newBadgeIds, recordAction, subscribeBadges, type BadgesResponse } from '../services/badgeService';
import { formatShortDate } from '../utils/format';

type Tab = 'ganadas' | 'por_ganar' | 'secretas' | 'vencidas';
const TABS: Tab[] = ['ganadas', 'por_ganar', 'secretas', 'vencidas'];

/** Mis insignias: ganadas, por ganar (con avance), secretas (solo pista) y vencidas (se pueden volver a ganar). */
export default function BadgesPage() {
  const t = useT().badges;
  const { data: app } = useAppState();
  const { data, loading, fromCache, enabled, refresh } = useBadges();
  const [tab, setTab] = useState<Tab>('ganadas');
  useSyncExternalStore(subscribeBadges, badgesVersion);
  const nuevas = newBadgeIds();
  const nuevasGanadas = (data?.ganadas ?? []).filter((b) => nuevas.includes(String(b.id))).map((b) => b.id);
  const claveNuevas = nuevasGanadas.join(',');

  // Las «Nueva» se dan por vistas tras unos segundos con la pestaña Ganadas en pantalla.
  useEffect(() => {
    if (tab !== 'ganadas' || !claveNuevas) return;
    const ids = claveNuevas.split(',');
    const t = setTimeout(() => { if (!document.hidden) markSeen(ids); }, 4000);
    return () => clearTimeout(t);
  }, [tab, claveNuevas]);

  // La descarga al entrar la hace useBadges; aquí solo se registra la apertura.
  useIonViewDidEnter(() => recordAction('mis_insignias'));

  const counts: Record<Tab, number> = {
    ganadas: data?.ganadas.length ?? 0,
    por_ganar: data?.por_ganar.length ?? 0,
    secretas: data?.secretas.length ?? 0,
    vencidas: data?.vencidas.length ?? 0,
  };
  const total = data?.total ?? 0;

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <section className="card badges-header">
        <Avatar name={app.settings.userName} size="lg" />
        <div className="badges-header__main">
          <h1 className="badges-header__name">{app.settings.userName.trim() || t.title}</h1>
          <p className="badges-header__total" aria-label={t.header.ofTotalAria(counts.ganadas, total)}>
            <strong>{t.header.ofTotal(counts.ganadas, total)}</strong> <span className="muted small">{t.header.earned}</span>
          </p>
        </div>
        {enabled && (
          <button className="icon-btn icon-btn--soft" onClick={() => void refresh()} disabled={loading} aria-label={t.refresh}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        )}
      </section>

      <section className="stat-grid stat-grid--4" aria-label={t.title}>
        {TABS.map((k) => (
          <div key={k} className="card stat-tile">
            <span>{t.tabs[k]}</span>
            <strong>{counts[k]}</strong>
          </div>
        ))}
      </section>

      {!enabled && <p className="callout callout--info small">{t.noServer}</p>}
      {enabled && fromCache && data && (
        <p className="callout callout--warning callout--row small" role="status">
          <WifiOff size={18} aria-hidden="true" /> <span>{t.offline}</span>
        </p>
      )}
      {enabled && fromCache && !data && !loading && <p className="callout callout--warning small" role="status">{t.error}</p>}
      {loading && !data && <p className="muted small center" role="status">{t.loading}</p>}

      <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as Tab)} className="segment segment--compact" aria-label={t.title}>
        {TABS.map((k) => (
          <IonSegmentButton key={k} value={k}>
            <IonLabel>{t.tabs[k]}{k === 'ganadas' && nuevasGanadas.length > 0 && <span className="new-dot" aria-label={t.newCount(nuevasGanadas.length)}>{nuevasGanadas.length}</span>}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>

      <BadgeList tab={tab} data={data} nuevas={nuevas} />
    </AppLayout>
  );
}

function BadgeList({ tab, data, nuevas }: { tab: Tab; data: BadgesResponse | null; nuevas: string[] }) {
  const t = useT().badges;
  const empty = <p className="card muted small center badge-empty">{t.empty[tab]}</p>;

  if (tab === 'ganadas') {
    const esNueva = (id: string | number) => nuevas.includes(String(id));
    // Las nuevas primero.
    const list = [...(data?.ganadas ?? [])].sort((a, b) => Number(esNueva(b.id)) - Number(esNueva(a.id)));
    if (!list.length) return empty;
    return (
      <ul className="badge-list" aria-label={t.tabs.ganadas}>
        {list.map((b) => (
          <li key={b.id} className={`card badge-item badge-item--${b.nivel}${esNueva(b.id) ? ' badge-item--nueva' : ''}`}>
            <BadgeArt level={b.nivel} image={b.imagen} />
            <div className="badge-item__body">
              <h3>{b.nombre}{esNueva(b.id) && <span className="badge-new">{t.isNew}</span>}</h3>
              <LevelTag level={b.nivel} />
              <p className="small">{b.descripcion}</p>
              <p className="small muted">{t.earnedOn(formatShortDate(b.obtenida))}</p>
              {b.vence && <p className="small badge-item__meta"><CalendarClock size={14} aria-hidden="true" /> {t.expiresOn(formatShortDate(b.vence))}</p>}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === 'por_ganar') {
    const list = data?.por_ganar ?? [];
    if (!list.length) return empty;
    return (
      <ul className="badge-list" aria-label={t.tabs.por_ganar}>
        {list.map((b) => {
          const pct = b.requerido > 0 ? Math.min(100, Math.round((b.avance / b.requerido) * 100)) : 0;
          return (
            <li key={b.id} className={`card badge-item badge-item--${b.nivel}`}>
              <BadgeArt level={b.nivel} image={b.imagen} dim />
              <div className="badge-item__body">
                <h3>{b.nombre}</h3>
                <LevelTag level={b.nivel} />
                <p className="small">{b.regla || b.descripcion}</p>
                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={b.requerido} aria-valuenow={b.avance} aria-label={t.progress(b.avance, b.requerido)}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <p className="small muted">{t.progress(b.avance, b.requerido)}</p>
                {b.hasta && <p className="small badge-item__meta"><CalendarClock size={14} aria-hidden="true" /> {t.until(formatShortDate(b.hasta))}</p>}
                {b.dura_dias ? <p className="small badge-item__meta"><Hourglass size={14} aria-hidden="true" /> {t.lasts(b.dura_dias)}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (tab === 'secretas') {
    const list = data?.secretas ?? [];
    if (!list.length) return empty;
    return (
      <ul className="badge-list" aria-label={t.tabs.secretas}>
        {list.map((b) => (
          <li key={b.id} className={`card badge-item badge-item--${b.nivel}`}>
            <BadgeArt level={b.nivel} locked />
            <div className="badge-item__body">
              <h3><Lock size={14} aria-hidden="true" /> {t.secretName}</h3>
              <LevelTag level={b.nivel} />
              <p className="small"><strong>{t.hint}:</strong> {b.pista}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const list = data?.vencidas ?? [];
  if (!list.length) return empty;
  return (
    <ul className="badge-list" aria-label={t.tabs.vencidas}>
      {list.map((b) => (
        <li key={b.id} className={`card badge-item badge-item--${b.nivel}`}>
          <BadgeArt level={b.nivel} image={b.imagen} dim />
          <div className="badge-item__body">
            <h3>{b.nombre}</h3>
            <LevelTag level={b.nivel} />
            {b.descripcion && <p className="small">{b.descripcion}</p>}
            <p className="small muted">{t.expiredOn(formatShortDate(b.vencio))}</p>
            <p className="small badge-item__meta badge-item__again"><RotateCcw size={14} aria-hidden="true" /> {t.winAgain}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
