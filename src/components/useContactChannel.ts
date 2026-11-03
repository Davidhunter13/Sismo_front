// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonActionSheet } from '@ionic/react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { openSmsComposer, openWhatsapp } from '../services/smsService';

/**
 * Pregunta por dónde enviar un mensaje a los contactos reales, en lugar de depender de que el enlace SMS lo
 * atienda la app correcta:
 * - «Por SMS»: abre la app de mensajes con todos los contactos reales.
 * - «WhatsApp: <nombre>»: abre el chat con el enlace oficial wa.me (número con código de país, sin «+»).
 * El texto se arma al elegir (`compose`), para que lleve datos al día (batería, ubicación).
 * `onDone` se ejecuta al cerrar el menú, se elija o no un canal (p. ej. para navegar).
 */
export function useContactChannel() {
  const [present] = useIonActionSheet();
  const { data } = useAppState();
  const t = useT().alert.safe;
  // Los contactos de demostración son ficticios: no se les envía nada.
  const contacts = data.contacts.filter((c) => !c.isSeed);

  return (header: string, compose: () => Promise<string>, onDone?: () => void) => {
    let action: ((message: string) => void) | null = null;
    void present({
      header,
      cssClass: 'sismo-sheet',
      buttons: [
        { text: t.viaSms(contacts.length), handler: () => { action = (m) => openSmsComposer(contacts, m); } },
        ...contacts.map((c) => ({ text: t.viaWhatsapp(c.name), handler: () => { action = (m) => openWhatsapp(c, m); } })),
        { text: t.cancel, role: 'cancel' },
      ],
      // La app externa se abre al terminar de cerrar el menú (si navegara antes, Ionic dejaría la vista oculta).
      onDidDismiss: () => {
        onDone?.();
        const send = action;
        if (send) void compose().then(send);
      },
    });
  };
}
