// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter, useIonToast } from '@ionic/react';
import { UserX } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { withLoader } from '../services/loaderService';
import { deleteAccount, syncEnabled } from '../services/syncService';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Configuración → Eliminar mi cuenta. Borra la cuenta en el servidor (borrado lógico en cascada + supresión de datos
 * personales y de salud; token y código revocados) y todo lo del teléfono; luego vuelve a la bienvenida para que la
 * persona pueda registrarse de nuevo. Solo aparece con servidor configurado (sin servidor basta «Borrar todos los datos»).
 */
export function DeleteAccountCard() {
  const t = useT().settings.account;
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const { wipeAfterAccountDeletion } = useAppState();
  const [confirm, setConfirm] = useState(false);

  if (!syncEnabled()) return null;

  const remove = async () => {
    const result = await withLoader(deleteAccount());
    if (result === 'ok') {
      wipeAfterAccountDeletion();
      void presentToast({ message: t.done, duration: 2600, color: 'success', position: 'top' });
      router.push('/bienvenida', 'root', 'replace');
    } else {
      void presentToast({ message: result === 'sin_red' ? t.offline : t.error, duration: 3200, color: 'danger', position: 'top' });
    }
  };

  return (
    <section className="card stack">
      <h2 className="card__title"><UserX size={18} aria-hidden="true" /> {t.title}</h2>
      <p className="small muted">{t.hint}</p>
      <button className="btn btn--danger-outline btn--block" onClick={() => setConfirm(true)}>
        <UserX size={18} aria-hidden="true" /> {t.button}
      </button>
      <ConfirmationDialog
        isOpen={confirm}
        title={t.confirmTitle}
        message={t.confirmMessage}
        confirmText={t.confirmAction}
        destructive
        onConfirm={() => void remove()}
        onClose={() => setConfirm(false)}
      />
    </section>
  );
}
