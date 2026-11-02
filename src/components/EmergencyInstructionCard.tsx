// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { LucideIcon } from 'lucide-react';

interface EmergencyInstructionCardProps {
  icon: LucideIcon;
  title: string;
  steps: string[];
}

export function EmergencyInstructionCard({ icon: Icon, title, steps }: EmergencyInstructionCardProps) {
  return (
    <article className="card instruction-card">
      <header>
        <span className="instruction-card__icon"><Icon size={22} aria-hidden="true" /></span>
        <h3>{title}</h3>
      </header>
      <ol>
        {steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
    </article>
  );
}
