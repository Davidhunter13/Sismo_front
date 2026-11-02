// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { LucideIcon } from 'lucide-react';
import { StatusBadge, type BadgeTone } from './StatusBadge';

interface ServiceIndicatorProps {
  icon: LucideIcon;
  name: string;
  detail: string;
  tone: BadgeTone;
  status: string;
}

/** Fila de disponibilidad de un servicio (sonido, ubicación, canal digital...). */
export function ServiceIndicator({ icon: Icon, name, detail, tone, status }: ServiceIndicatorProps) {
  return (
    <li className="service-row">
      <span className="service-row__icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="service-row__text">
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
      <StatusBadge tone={tone} label={status} />
    </li>
  );
}
