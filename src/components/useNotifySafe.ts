// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { getBatteryLevel } from '../services/batteryService';
import { buildSafeMessage } from '../services/smsService';
import type { EventType, LocationSnapshot } from '../types';
import { useContactChannel } from './useContactChannel';

/**
 * Aviso «Estoy bien» por SMS o WhatsApp (el canal se elige con useContactChannel). Antes, en algunos teléfonos
 * el enlace sms: lo abría WhatsApp, que no lo entiende y decía que el número no estaba registrado.
 * `onDone` se ejecuta al cerrar el menú, se elija o no un canal (p. ej. para navegar).
 */
export function useNotifySafe() {
  const { data } = useAppState();
  const t = useT().alert.safe;
  const choose = useContactChannel();

  /**
   * @param location ubicación a enviar (p. ej. la de la alerta); por defecto la última guardada.
   */
  return (eventType?: EventType, onDone?: () => void, location: LocationSnapshot | null = data.lastLocation) => {
    // El mensaje lleva la ubicación, los puntos de encuentro y la batería (se lee al elegir el canal).
    const compose = async () =>
      buildSafeMessage(data.settings.userName, eventType, new Date(), {
        location,
        meetingPoints: data.meetingPoints,
        batteryLevel: await getBatteryLevel(),
      });
    choose(t.sheetHeader, compose, onDone);
  };
}
