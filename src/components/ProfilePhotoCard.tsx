// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonToast, useIonViewDidEnter } from '@ionic/react';
import { Camera, ImagePlus, ShieldCheck, Trash2, WifiOff } from 'lucide-react';
import { useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { recordAction } from '../services/badgeService';
import { withLoader } from '../services/loaderService';
import { useOnline } from '../services/networkService';
import {
  deletePhoto, hasPhoto, pendingPhoto, photoSnapshot, resizeImage, subscribePhoto, takeRejectedPhoto, uploadPhoto, validatePhotoFile,
} from '../services/photoService';
import { syncEnabled } from '../services/syncService';
import { Avatar } from './Avatar';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Configuración → tarjeta «Perfil»: foto de perfil (tomar con la cámara, elegir de la galería o quitar). Se reduce en el
 * teléfono a ≤512 px JPEG antes de subirla. Sin servidor o sin red se explica por qué no se puede.
 */
export function ProfilePhotoCard() {
  const [presentToast] = useIonToast();
  const t = useT().badges.photo;
  const { data } = useAppState();
  const online = useOnline();
  useSyncExternalStore(subscribePhoto, photoSnapshot);
  const enabled = syncEnabled();
  const has = hasPhoto();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2600, color, position: 'top' });

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite elegir el mismo archivo otra vez
    if (!file) return;
    const check = validatePhotoFile(file);
    if (check !== 'ok') {
      toast(t.errors[check], 'danger');
      return;
    }
    setBusy(true);
    try {
      let dataUrl: string;
      try {
        dataUrl = await resizeImage(file);
      } catch {
        toast(t.errors.procesar, 'danger');
        return;
      }
      const r = await withLoader(uploadPhoto(dataUrl));
      if (r.ok && r.pending) {
        // Sin internet o el servidor falló: se ve ya y se sube sola al volver la conexión.
        toast(t.queued, 'warning');
      } else if (r.ok) {
        recordAction('foto_perfil');
        toast(t.uploaded);
      } else {
        toast(t.errors[r.error], 'danger');
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const r = await withLoader(deletePhoto());
    setBusy(false);
    if (r.ok) toast(r.pending ? t.queuedDelete : t.removed, r.pending ? 'warning' : 'medium');
    else toast(t.errors[r.error], 'danger');
  };

  // Sin internet se puede elegir igual: queda pendiente y se sube sola al volver la conexión.
  const disabled = busy || !enabled;
  const pending = pendingPhoto();

  // La foto pendiente que el servidor rechazó (422) se avisa al abrir Configuración.
  useIonViewDidEnter(() => {
    if (takeRejectedPhoto()) toast(t.rejected, 'danger');
  });

  return (
    <div className="stack photo-card" role="group" aria-label={t.title}>
      <div className="photo-card__row">
        <Avatar name={data.settings.userName} size="lg" />
        <div className="photo-card__info">
          <strong>{t.title}</strong>
          {pending?.op === 'upload' ? (
            <span className="pending-tag" role="status">{t.pending}</span>
          ) : pending?.op === 'delete' ? (
            <small className="muted" role="status">{t.pendingDelete}</small>
          ) : (
            <small className="muted">{has ? '' : t.noPhoto}</small>
          )}
        </div>
      </div>

      {!enabled && <p className="callout callout--info small">{t.noServer}</p>}
      {enabled && !online && (
        <p className="callout callout--warning callout--row small" role="status">
          <WifiOff size={18} aria-hidden="true" /> <span>{t.offline}</span>
        </p>
      )}

      <div className="btn-pair">
        <button className="btn btn--primary" onClick={() => cameraRef.current?.click()} disabled={disabled}>
          <Camera size={18} aria-hidden="true" /> {t.take}
        </button>
        <button className="btn btn--outline" onClick={() => galleryRef.current?.click()} disabled={disabled}>
          <ImagePlus size={18} aria-hidden="true" /> {t.choose}
        </button>
      </div>
      {has && (
        <button className="btn btn--danger-outline btn--block" onClick={() => setConfirm(true)} disabled={disabled}>
          <Trash2 size={18} aria-hidden="true" /> {t.remove}
        </button>
      )}
      {/* Entradas ocultas: la cámara frontal (capture="user") y la galería. */}
      <input ref={cameraRef} className="visually-hidden" type="file" accept="image/*" capture="user" onChange={(e) => void onFile(e)} tabIndex={-1} aria-hidden="true" data-testid="foto-camara" />
      <input ref={galleryRef} className="visually-hidden" type="file" accept="image/*" onChange={(e) => void onFile(e)} tabIndex={-1} aria-hidden="true" data-testid="foto-galeria" />

      <p className="small muted callout--row photo-card__privacy">
        <ShieldCheck size={16} aria-hidden="true" /> <span>{t.privacy}</span>
      </p>

      <ConfirmationDialog
        isOpen={confirm}
        title={t.removeTitle}
        message={t.removeMessage}
        confirmText={t.removeAction}
        destructive
        onConfirm={() => void remove()}
        onClose={() => setConfirm(false)}
      />
    </div>
  );
}
