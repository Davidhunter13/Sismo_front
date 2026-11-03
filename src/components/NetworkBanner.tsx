// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { WifiOff } from 'lucide-react';
import { useT } from '../i18n/useT';
import { useOnline } from '../services/networkService';

/** Aviso cuando no hay internet: qué sigue funcionando y qué no. No se muestra con conexión. */
export function NetworkBanner() {
  const t = useT().features.network;
  const online = useOnline();
  if (online) return null;
  return (
    <p className="callout callout--warning callout--row small network-banner" role="status">
      <WifiOff size={18} aria-hidden="true" />
      <span><strong>{t.offline}.</strong> {t.offlineHint}</span>
    </p>
  );
}
