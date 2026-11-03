// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useT } from '../i18n/useT';
import type { AlertRecord } from '../types';
import { eventTypeLabel, formatTime } from '../utils/format';
import { ActiveAlertBadge, StatusBadge } from './StatusBadge';

interface AlertStatusCardProps {
  alert: AlertRecord | null;
  onOpen?: () => void;
}

/** Tarjeta de estado de seguridad del panel principal. */
export function AlertStatusCard({ alert, onOpen }: AlertStatusCardProps) {
  const t = useT().components.alertStatus;
  if (!alert) {
    return (
      <section className="card status-card status-card--ok" aria-live="polite">
        <div className="status-card__icon"><ShieldCheck size={28} aria-hidden="true" /></div>
        <div className="status-card__body">
          <h2>{t.noneTitle}</h2>
          <p>{t.noneText}</p>
        </div>
        <StatusBadge tone="success" label={t.normal} />
      </section>
    );
  }

  return (
    <button className="card status-card status-card--alert" onClick={onOpen} aria-live="assertive">
      <div className="status-card__icon"><ShieldAlert size={28} aria-hidden="true" /></div>
      <div className="status-card__body">
        <h2>{t.ongoing(eventTypeLabel[alert.eventType])}</h2>
        <p>{t.activatedAt(formatTime(alert.activatedAt))}</p>
        <ActiveAlertBadge />
      </div>
      <ChevronRight size={22} aria-hidden="true" />
    </button>
  );
}
