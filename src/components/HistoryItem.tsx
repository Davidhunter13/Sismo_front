// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { ChevronRight } from 'lucide-react';
import { getCatalogs, iconOf } from '../services/catalogService';
import { catalogIcon } from './catalogIcons';
import { useT } from '../i18n/useT';
import type { AlertRecord } from '../types';
import { eventTypeLabel, formatDateTime } from '../utils/format';
import { ActiveAlertBadge, DemoBadge, StatusBadge } from './StatusBadge';
import { deliveryBadge } from './statusMaps';

export function HistoryItem({ alert, onOpen }: { alert: AlertRecord; onOpen: () => void }) {
  const t = useT().history.item;
  const Icon = catalogIcon(iconOf(getCatalogs().eventTypes, alert.eventType));
  const delivery = deliveryBadge[alert.digitalStatus];
  return (
    <li>
      <button className="card history-item" onClick={onOpen}>
        <span className={`history-item__icon history-item__icon--${alert.eventType}`}><Icon size={20} aria-hidden="true" /></span>
        <span className="history-item__body">
          <strong>{eventTypeLabel[alert.eventType]}</strong>
          <small>{formatDateTime(alert.activatedAt)}</small>
          <span className="badge-row">
            {alert.status === 'activa' ? <ActiveAlertBadge /> : <StatusBadge tone="neutral" label={t.finished} />}
            <StatusBadge tone={delivery.tone} label={`${delivery.label}${alert.simulatedDelivery ? t.simSuffix : ''}`} />
            {alert.isSeed && <DemoBadge label={t.sample} />}
          </span>
        </span>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </li>
  );
}
