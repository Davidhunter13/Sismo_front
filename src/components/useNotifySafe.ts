// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonActionSheet } from '@ionic/react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { buildSafeMessage, openSmsComposer, openWhatsapp } from '../services/smsService';
import { getBatteryLevel } from '../services/batteryService';
import type { EventType, LocationSnapshot } from '../types';

/**
 * Aviso «Estoy bien»: pregunta el canal en lugar de depender de que el enlace SMS lo atienda la app correcta.
 * - «Por SMS»: abre la app de mensajes con todos los contactos reales.
 * - «WhatsApp: <nombre>»: abre el chat con el enlace oficial wa.me (número con código de país, sin «+»).
 *   Antes, en algunos teléfonos el enlace sms: lo abría WhatsApp, que no lo entiende y decía que el número
 *   no estaba registrado.
 * `onDone` se ejecuta al cerrar el menú, se elija o no un canal (p. ej. para navegar).
 */
export function useNotifySafe() {
  const [present] = useIonActionSheet();
  const { data } = useAppState();
  const t = useT().alert.safe;
  // Los contactos de demostración son ficticios: no se les envía nada.
  const contacts = data.contacts.filter((c) => !c.isSeed);

  /**
   * @param location ubicación a enviar (p. ej. la de la alerta); por defecto la última guardada.
   */
  return (eventType?: EventType, onDone?: () => void, location: LocationSnapshot | null = data.lastLocation) => {
    // El mensaje lleva la ubicación, el punto de encuentro y la batería (se lee al elegir el canal).
    const compose = async () =>
      buildSafeMessage(data.settings.userName, eventType, new Date(), {
        location,
        meetingPoint: data.meetingPoint,
        batteryLevel: await getBatteryLevel(),
      });
    let action: ((message: string) => void) | null = null;
    void present({
      header: t.sheetHeader,
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
