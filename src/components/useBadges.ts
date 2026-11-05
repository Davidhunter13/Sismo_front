// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonViewDidEnter } from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { badgesVersion, cachedBadges, fetchBadges, recordAction, subscribeBadges, type BadgeKey, type BadgesResponse } from '../services/badgeService';
import { syncEnabled } from '../services/syncService';

export interface BadgesState {
  data: BadgesResponse | null;
  loading: boolean;
  /** true si lo mostrado es la copia guardada (sin red o el servidor no respondió). */
  fromCache: boolean;
  enabled: boolean;
  refresh: () => Promise<void>;
}

/**
 * Insignias: la copia guardada se muestra mientras carga (o sin red) y se reemplaza por la del servidor, que se pide
 * SIEMPRE al montar y cada vez que se vuelve a entrar a la pantalla (Ionic conserva las vistas montadas).
 */
export function useBadges(): BadgesState {
  const version = useSyncExternalStore(subscribeBadges, badgesVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => cachedBadges(), [version]);
  const enabled = syncEnabled();
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const r = await fetchBadges();
    if (!mounted.current) return;
    setFromCache(r.fromCache);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  // Al volver a la pantalla (p. ej. Inicio tras ganar algo en otra): se pide de nuevo.
  useIonViewDidEnter(() => void refresh(), [refresh]);

  return { data, loading, fromCache, enabled, refresh };
}

/** Registra un hecho de insignias cada vez que se entra a la pantalla (Ionic conserva las vistas montadas). */
export function useRecordOnEnter(clave: BadgeKey): void {
  useIonViewDidEnter(() => recordAction(clave));
}
