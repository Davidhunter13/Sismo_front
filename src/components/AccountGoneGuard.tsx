// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter, useIonToast } from '@ionic/react';
import { useEffect } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';

/**
 * Cuando el servidor dice que la cuenta ya no existe (borrada desde el panel, base vaciada o recuperada en otro
 * teléfono), borra los datos de este teléfono y lleva al registro, para que la persona empiece de nuevo y agregue
 * sus contactos. No se vuelve a crear la cuenta con los datos viejos.
 * Nunca interrumpe una emergencia: con una alerta activa o un simulacro espera a que terminen.
 */
export function AccountGoneGuard() {
  const { accountGone, finishAccountGone, data, drill } = useAppState();
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const t = useT().settings.accountGone;
  const busy = data.activeAlertId !== null || drill !== null;

  useEffect(() => {
    if (!accountGone || busy) return;
    finishAccountGone();
    router.push('/bienvenida', 'root', 'replace');
    void presentToast({ message: t, duration: 4000, color: 'warning', position: 'top' });
  }, [accountGone, busy, finishAccountGone, router, presentToast, t]);

  return null;
}
