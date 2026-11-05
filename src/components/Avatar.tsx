// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { CloudUpload, User } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { pendingPhoto, photoSnapshot, subscribePhoto } from '../services/photoService';
import { useT } from '../i18n/useT';
import { initials, usePhotoUrl } from './usePhotoUrl';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Foto de perfil o, si no hay, las iniciales del nombre. */
export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const t = useT().badges.photo;
  const { url, onError } = usePhotoUrl();
  const letters = initials(name);
  useSyncExternalStore(subscribePhoto, photoSnapshot);
  const pending = pendingPhoto()?.op === 'upload';
  return (
    <span className={`avatar avatar--${size} ${className}`.trim()}>
      {url ? (
        <img src={url} alt={t.avatarAlt(name.trim())} onError={onError} />
      ) : letters ? (
        <span className="avatar__initials" role="img" aria-label={t.noPhoto}>{letters}</span>
      ) : (
        <User aria-label={t.noPhoto} role="img" />
      )}
      {pending && (
        <span className="avatar__pending" title={t.pending}>
          <CloudUpload aria-label={t.pending} role="img" />
        </span>
      )}
    </span>
  );
}
