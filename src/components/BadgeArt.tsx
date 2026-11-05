// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Award, Lock } from 'lucide-react';
import { useState } from 'react';
import { useT } from '../i18n/useT';
import type { BadgeLevel } from '../services/badgeService';

const LEVELS: BadgeLevel[] = ['bronce', 'plata', 'oro', 'diamante', 'especial'];

interface BadgeArtProps {
  level: BadgeLevel;
  image?: string;
  locked?: boolean;
  /** Atenuada (vencida o por ganar). */
  dim?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/** Imagen de la insignia dentro de un marco con el color de su nivel (o un candado si es secreta). */
export function BadgeArt({ level, image, locked, dim, size = 'md' }: BadgeArtProps) {
  const t = useT().badges;
  const [failed, setFailed] = useState(false);
  const lvl = LEVELS.includes(level) ? level : 'bronce';
  return (
    <span
      className={`badge-art badge-art--${lvl} badge-art--${size}${dim ? ' badge-art--dim' : ''}`}
      role="img"
      aria-label={t.levelAria(t.levels[lvl])}
    >
      {locked ? (
        <Lock aria-hidden="true" />
      ) : image && !failed ? (
        <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Award aria-hidden="true" />
      )}
    </span>
  );
}

/** Etiqueta con el nombre del nivel (texto además del color, para alto contraste y lectores de pantalla). */
export function LevelTag({ level }: { level: BadgeLevel }) {
  const t = useT().badges;
  const lvl = LEVELS.includes(level) ? level : 'bronce';
  return <span className={`level-tag level-tag--${lvl}`}>{t.levels[lvl]}</span>;
}
