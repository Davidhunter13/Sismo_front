// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLang, getT } from '../i18n';
import type { AlertRecord, Contact, EmailStatus, MedicalInfo, MeetingPoint } from '../types';
import { buildAlertMessage } from './smsService';

/**
 * Correo de alerta a los contactos, enviado por un servidor propio (pendiente de conectar).
 *
 * El cliente NO envía correos ni guarda credenciales: arma la solicitud y la manda por POST a la URL
 * configurada en `VITE_ALERT_EMAIL_URL` (archivo .env, fuera de git). Mientras no esté configurada,
 * no se envía nada y el estado queda en 'sin_servidor' (la interfaz lo dice con claridad).
 *
 * Contrato propuesto para el servidor (JSON):
 *   POST {VITE_ALERT_EMAIL_URL}
 *   {
 *     "alertId": "uuid", "eventType": "sismo", "activatedAt": "ISO-8601", "language": "es" | "en",
 *     "sender": { "name": "Ana" },
 *     "recipients": [{ "name": "Luis", "email": "luis@correo.com" }],
 *     "subject": "…", "body": "…texto plano con ubicación, punto de encuentro, ficha médica y batería…",
 *     "location": { "latitude": 4.65, "longitude": -74.1, "accuracy": 12 } | null
 *   }
 *   Respuesta esperada: 2xx si el servidor aceptó la solicitud. El servidor valida los correos, aplica límites
 *   de envío y guarda las credenciales del proveedor de correo.
 */

/** Segundos para responder antes de enviar automáticamente. */
export const EMAIL_COUNTDOWN_S = 20;
const TIMEOUT_MS = 10_000;
/** Reintentos ante errores de red o 5xx (espera exponencial: 1 s, 2 s). */
const RETRIES = 2;

export interface AlertEmailRequest {
  alertId: string;
  eventType: string;
  activatedAt: string;
  language: string;
  sender: { name: string };
  recipients: { name: string; email: string }[];
  subject: string;
  body: string;
  location: { latitude: number; longitude: number; accuracy?: number } | null;
}

/** URL del servidor de correo, o null si aún no está configurada. */
export function emailEndpoint(): string | null {
  const url = (import.meta.env.VITE_ALERT_EMAIL_URL as string | undefined)?.trim();
  return url ? url : null;
}

/** Contactos reales con correo (los de demostración son ficticios y nunca reciben correos). */
export function emailRecipients(contacts: Contact[]): Contact[] {
  return contacts.filter((c) => !c.isSeed && !!c.email?.trim());
}

export function buildAlertEmail(
  alert: AlertRecord,
  userName: string,
  recipients: Contact[],
  meetingPoint: MeetingPoint | null,
  medical: MedicalInfo | null,
  batteryLevel: number | null,
): AlertEmailRequest {
  const t = getT().services.email;
  return {
    alertId: alert.id,
    eventType: alert.eventType,
    activatedAt: alert.activatedAt,
    language: getLang(),
    sender: { name: userName.trim() },
    recipients: recipients.map((c) => ({ name: c.name, email: (c.email ?? '').trim() })),
    subject: t.subject(userName.trim() || t.defaultWho),
    body: buildAlertMessage(userName, alert.eventType, alert.location, meetingPoint, medical, batteryLevel),
    location: alert.location
      ? { latitude: alert.location.latitude, longitude: alert.location.longitude, accuracy: alert.location.accuracy }
      : null,
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Envía la solicitud al servidor. Nunca lanza: devuelve el estado resultante. */
export async function sendAlertEmail(request: AlertEmailRequest): Promise<EmailStatus> {
  if (request.recipients.length === 0) return 'sin_destinatarios';
  const url = emailEndpoint();
  if (!url) return 'sin_servidor';
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: ctrl.signal,
      });
      if (res.ok) return 'enviado';
      // 4xx: la solicitud es inválida; reintentar no ayuda.
      if (res.status < 500) return 'fallido';
    } catch {
      // Error de red o tiempo agotado: se reintenta.
    } finally {
      clearTimeout(timer);
    }
    if (attempt < RETRIES) await wait(1000 * 2 ** attempt);
  }
  return 'fallido';
}
