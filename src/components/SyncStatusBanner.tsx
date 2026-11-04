// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { CloudOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useT } from '../i18n/useT';
import { useOnline } from '../services/networkService';
import { getSyncStatus, subscribeSyncStatus, syncEnabled } from '../services/syncService';

/**
 * Aviso en todas las pantallas cuando los datos no se pueden subir:
 * - sin internet: «Sus datos se guardan en el teléfono y se subirán apenas haya conexión»;
 * - con internet pero sin respuesta del servidor: mismo mensaje, indicando que es el servidor.
 * Nada se pierde: los cambios esperan en la cola persistente (syncService). Sin servidor configurado no se muestra.
 */
export function SyncStatusBanner() {
  const t = useT().components.sync;
  const online = useOnline();
  const status = useSyncExternalStore(subscribeSyncStatus, getSyncStatus);
  if (!syncEnabled()) return null;
  const [pendingText, reachable] = status.split('|');
  const pending = Number(pendingText);
  const serverDown = online && reachable === '0';
  if (online && !serverDown) return null;
  return (
    <p className="callout callout--warning callout--row small sync-banner" role="status" aria-live="polite">
      <CloudOff size={18} aria-hidden="true" />
      <span>
        <strong>{online ? t.serverTitle : t.offlineTitle}</strong> {online ? t.server : t.offline}
        {pending > 0 && <> {t.pending(pending)}</>}
      </span>
    </p>
  );
}
