// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Square, Volume2, type LucideIcon } from 'lucide-react';

interface EmergencyInstructionCardProps {
  icon: LucideIcon;
  title: string;
  steps: string[];
  /** true mientras esta tarjeta se está leyendo en voz alta. */
  speaking?: boolean;
  /** Si se indica, muestra el botón «Escuchar». */
  onListen?: () => void;
}

export function EmergencyInstructionCard({ icon: Icon, title, steps, speaking, onListen }: EmergencyInstructionCardProps) {
  return (
    <article className="card instruction-card">
      <header>
        <span className="instruction-card__icon"><Icon size={22} aria-hidden="true" /></span>
        <h3>{title}</h3>
        {onListen && (
          <button
            className={`icon-btn ${speaking ? 'icon-btn--danger' : 'icon-btn--soft'} instruction-card__listen`}
            onClick={onListen}
            aria-label={speaking ? `Detener lectura de ${title}` : `Escuchar ${title}`}
          >
            {speaking ? <Square size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
          </button>
        )}
      </header>
      <ol>
        {steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
    </article>
  );
}
