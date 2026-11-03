// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { AlertTriangle, CheckCircle2, CircleSlash, Clock, FlaskConical, Info, Radio, XCircle, type LucideIcon } from 'lucide-react';
import { useT } from '../i18n/useT';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'demo';

const toneIcon: Record<BadgeTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: Info,
  neutral: CircleSlash,
  demo: FlaskConical,
};

interface StatusBadgeProps {
  tone: BadgeTone;
  label: string;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
}

/** Insignia de estado: siempre combina color + icono + texto (no depende solo del color). */
export function StatusBadge({ tone, label, icon, size = 'sm' }: StatusBadgeProps) {
  const Icon = icon ?? toneIcon[tone];
  return (
    <span className={`badge badge--${tone} badge--${size}`}>
      <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ActiveAlertBadge() {
  const t = useT().components.badge;
  return <StatusBadge tone="danger" label={t.activeAlert} icon={AlertTriangle} />;
}

export function LocalBadge() {
  const t = useT().components.badge;
  return <StatusBadge tone="info" label={t.local} icon={Radio} />;
}

export function DemoBadge({ label }: { label?: string }) {
  const t = useT().components.badge;
  return <StatusBadge tone="demo" label={label ?? t.demo} />;
}
