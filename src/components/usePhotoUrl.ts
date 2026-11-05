// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useSyncExternalStore } from 'react';
import { currentPhoto, currentPhotoUrl, getPhoto, photoSnapshot, REFRESH_MARGIN_MS, subscribePhoto } from '../services/photoService';
import { syncEnabled } from '../services/syncService';

/** Iniciales (máximo dos) del nombre; vacío si no hay nombre. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * URL firmada de la foto de perfil. La pide al montar y otra vez justo antes de que venza (o si la imagen falla),
 * sin guardarla nunca como permanente.
 */
export function usePhotoUrl(): { url: string | null; onError: () => void } {
  useSyncExternalStore(subscribePhoto, photoSnapshot);
  const enabled = syncEnabled();
  const photo = currentPhoto();
  const url = currentPhotoUrl();

  useEffect(() => {
    if (enabled) void getPhoto();
  }, [enabled]);

  const expira = photo?.expira;
  useEffect(() => {
    if (!enabled || !expira) return;
    const ms = Math.max(1_000, new Date(expira).getTime() - Date.now() - REFRESH_MARGIN_MS);
    const timer = window.setTimeout(() => void getPhoto(true), Math.min(ms, 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [enabled, expira]);

  return { url, onError: () => void getPhoto(true) };
}
