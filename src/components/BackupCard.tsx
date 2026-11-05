// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, useIonToast } from '@ionic/react';
import { CloudUpload, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppState } from '../context/appContext';
import { recordAction } from '../services/badgeService';
import { useT } from '../i18n/useT';
import { createRecoveryCode, pendingCount, recoverAccount, syncEnabled } from '../services/syncService';
import { withLoader } from '../services/loaderService';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Configuración → Respaldo y recuperación. Solo aparece con servidor configurado (VITE_SISMO_API_URL).
 * Crear código: para guardarlo fuera del teléfono. Recuperar: en un teléfono nuevo, reemplaza los datos locales.
 */
export function BackupCard() {
  const t = useT().settings.backup;
  const { restoreFromServer } = useAppState();
  const [presentToast] = useIonToast();
  const [pending, setPending] = useState(pendingCount);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<'create' | 'recover' | null>(null);
  const [input, setInput] = useState('');
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setPending(pendingCount()), 3000);
    return () => window.clearInterval(timer);
  }, []);

  if (!syncEnabled()) return null;

  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2600, color, position: 'top' });

  const create = async () => {
    setBusy('create');
    const result = await withLoader(createRecoveryCode());
    setBusy(null);
    if (result) {
      setCode(result);
      recordAction('respaldo');
    } else toast(t.codeError, 'danger');
  };

  const recover = async () => {
    setBusy('recover');
    const result = await withLoader(recoverAccount(input));
    setBusy(null);
    if (result.ok) {
      restoreFromServer(result.state);
      setInput('');
      toast(t.recovered);
    } else {
      toast(result.reason === 'codigo_invalido' ? t.invalidCode : t.offline, 'danger');
    }
  };

  const validInput = input.replace(/[^A-Za-z0-9]/g, '').length === 12;

  return (
    <section className="card stack">
      <h2 className="card__title"><CloudUpload size={18} aria-hidden="true" /> {t.title}</h2>
      <p className="small muted">{t.hint}</p>
      <p className="small">{pending > 0 ? t.pending(pending) : t.synced}</p>

      <button className="btn btn--outline btn--block" onClick={() => void create()} disabled={busy !== null}>
        <KeyRound size={18} aria-hidden="true" /> {busy === 'create' ? t.creating : t.create}
      </button>
      {code && (
        <div className="medical-card" role="status">
          <strong>{t.codeTitle}</strong>
          <p style={{ font: '700 24px/1.3 ui-monospace, Consolas, monospace', letterSpacing: 3, textAlign: 'center', margin: '8px 0', userSelect: 'all' }}>{code}</p>
          <p className="small muted">{t.codeHint}</p>
        </div>
      )}

      <IonInput
        label={t.recoverLabel}
        labelPlacement="stacked"
        fill="outline"
        value={input}
        placeholder={t.recoverPlaceholder}
        maxlength={20}
        autocapitalize="characters"
        onIonInput={(e) => setInput(String(e.detail.value ?? '').toUpperCase())}
      />
      <button className="btn btn--primary btn--block" onClick={() => setConfirm(true)} disabled={!validInput || busy !== null}>
        {busy === 'recover' ? t.recovering : t.recover}
      </button>

      <ConfirmationDialog
        isOpen={confirm}
        title={t.confirmTitle}
        message={t.confirmMessage}
        confirmText={t.confirmAction}
        destructive
        onConfirm={() => void recover()}
        onClose={() => setConfirm(false)}
      />
    </section>
  );
}
