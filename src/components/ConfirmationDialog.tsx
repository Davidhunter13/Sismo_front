// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonAlert, type AlertInput } from '@ionic/react';
import { useRef } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  inputs?: AlertInput[];
  onConfirm: (value?: unknown) => void;
  /** Se ejecuta dentro del toque de confirmación (gesto del usuario), antes de cerrar el diálogo. */
  onConfirmPress?: (value?: unknown) => void;
  onClose: () => void;
}

/** Diálogo de confirmación para acciones sensibles (activar alerta, eliminar, restablecer). */
export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  inputs,
  onConfirm,
  onConfirmPress,
  onClose,
}: ConfirmationDialogProps) {
  const confirmed = useRef<{ value: unknown } | null>(null);

  // La acción se ejecuta cuando el diálogo terminó de cerrarse: si navegara antes,
  // Ionic dejaría aria-hidden="true" en la app (invisible para lectores de pantalla).
  const handleDidDismiss = () => {
    const pending = confirmed.current;
    confirmed.current = null;
    onClose();
    if (pending) onConfirm(pending.value);
  };

  return (
    <IonAlert
      isOpen={isOpen}
      header={title}
      message={message}
      inputs={inputs ?? []}
      cssClass="sismo-alert"
      onDidDismiss={handleDidDismiss}
      buttons={[
        { text: cancelText, role: 'cancel', cssClass: 'sismo-alert__cancel' },
        {
          text: confirmText,
          role: 'confirm',
          cssClass: destructive ? 'sismo-alert__danger' : 'sismo-alert__confirm',
          handler: (value) => {
            confirmed.current = { value };
            onConfirmPress?.(value);
          },
        },
      ]}
    />
  );
}
