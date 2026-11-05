// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLang, getT } from '../i18n';
import type { AlertRecord, Contact, EmailStatus, MedicalInfo, MeetingPoint } from '../types';
import { distanceKm } from './quakeService';
import { buildAlertMessage } from './smsService';
import { deviceToken, flush, syncEndpoint } from './syncService';

/**
 * Correo de alerta a los contactos, enviado por el backend de SISMO con el servicio de correo de la organización.
 *
 * El cliente NO envía correos, NO guarda credenciales y NO decide a quién se escribe: llama a
 *   POST {VITE_SISMO_API_URL}/correo_alerta/{alertId}   (Authorization: Bearer <token del teléfono>)
 *   { "tipo": "alerta" | "caida" | "urgente" | "atrapado" | "bateria", "mensaje": "…texto plano…", "idioma": "es" | "en" }
 * y el servidor toma los destinatarios de los contactos guardados de la persona: los marcados como principales
 * van en «Para» y los demás en copia oculta (si ninguno está marcado, el primero hace de principal). Envía una
 * sola vez por alerta y tipo, nunca en simulacros y con un límite por hora.
 *
 * Tipos: «alerta» = activó la alarma (el correo principal, con cuenta regresiva); «caida» = la alerta se activó sola
 * por una caída sin respuesta (reemplaza al inicial); «urgente», «atrapado» y «bateria» = avisos durante la alerta.
 */

/** Segundos para responder antes de enviar automáticamente el correo de «activó la alarma». */
export const EMAIL_COUNTDOWN_S = 20;
const TIMEOUT_MS = 15_000;
/** Reintentos ante errores de red o 5xx (espera exponencial: 1 s, 2 s). */
const RETRIES = 2;

export type EmailKind = 'alerta' | 'caida' | 'urgente' | 'atrapado' | 'bateria' | 'ubicacion';

/** Ubicación actualizada por correo: solo si se desplazó al menos esto y pasó este tiempo desde la última enviada. */
export const LOCATION_EMAIL_MIN_METERS = 200;
export const LOCATION_EMAIL_MIN_MINUTES = 15;

/**
 * ¿Toca enviar la ubicación actualizada? 'base' = aún no hay ubicación enviada (se toma la actual como punto de
 * partida, sin enviar); 'enviar' = se desplazó lo suficiente y pasó el tiempo mínimo; null = todavía no.
 */
export function locationEmailDue(
  last: { latitude: number; longitude: number; at: string } | undefined,
  now: { latitude: number; longitude: number },
  nowMs: number = Date.now(),
): 'base' | 'enviar' | null {
  if (!last) return 'base';
  const meters = distanceKm(last.latitude, last.longitude, now.latitude, now.longitude) * 1000;
  const minutes = (nowMs - new Date(last.at).getTime()) / 60_000;
  return meters >= LOCATION_EMAIL_MIN_METERS && minutes >= LOCATION_EMAIL_MIN_MINUTES ? 'enviar' : null;
}

/** Correo inicial de la alerta: «caída» si se activó sola por una caída sin respuesta; si no, «activó la alarma». */
export const initialEmailKind = (alert: AlertRecord): EmailKind => (alert.fallNoResponse ? 'caida' : 'alerta');

export interface AlertEmailRequest {
  alertId: string;
  kind: EmailKind;
  message: string;
  language: string;
}

/** Contactos reales con correo (los de demostración son ficticios y nunca reciben correos). */
export function emailRecipients(contacts: Contact[]): Contact[] {
  return contacts.filter((c) => !c.isSeed && !!c.email?.trim());
}

/**
 * Arma el mensaje (texto plano) con la ubicación, los puntos de encuentro, la ficha médica (si la persona aceptó
 * compartirla) y la batería. Los avisos llevan una primera línea que explica qué cambió.
 */
export function buildAlertEmail(
  alert: AlertRecord,
  userName: string,
  meetingPoints: MeetingPoint[],
  medical: MedicalInfo | null,
  batteryLevel: number | null,
  kind: EmailKind = 'alerta',
): AlertEmailRequest {
  const t = getT().services.email;
  const who = userName.trim() || t.defaultWho;
  const lead = kind === 'alerta' ? null : kind === 'caida' ? t.leadFall(who) : t.lead[kind](who, batteryLevel);
  const body = buildAlertMessage(userName, alert.eventType, alert.location, meetingPoints, medical, batteryLevel);
  return { alertId: alert.id, kind, message: lead ? `${lead}\n\n${body}` : body, language: getLang() };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Dependencias del envío (se reemplazan en las pruebas). */
export interface EmailDeps {
  base: string | null;
  token: string | null;
  /** Sube lo pendiente (contactos y alerta) antes de pedir el correo. */
  syncFirst: () => Promise<void>;
}
const defaultDeps = (): EmailDeps => ({ base: syncEndpoint(), token: deviceToken(), syncFirst: flush });

/** Envía la solicitud al backend. Nunca lanza: devuelve el estado resultante. */
export async function sendAlertEmail(request: AlertEmailRequest, deps: Partial<EmailDeps> = {}): Promise<EmailStatus> {
  const d = { ...defaultDeps(), ...deps };
  if (!d.base) return 'sin_servidor';
  // La alerta y los contactos deben estar en el servidor antes de pedir el correo.
  await d.syncFirst().catch(() => undefined);
  const token = deps.token !== undefined ? deps.token : deviceToken();
  if (!token) return 'fallido';
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${d.base}/correo_alerta/${encodeURIComponent(request.alertId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo: request.kind, mensaje: request.message, idioma: request.language }),
        signal: ctrl.signal,
      });
      if (res.ok) return 'enviado';
      const error = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
      if (error === 'sin_destinatarios') return 'sin_destinatarios';
      if (error === 'correo_no_disponible') return 'sin_servidor';
      // Otros 4xx (simulacro, límite, alerta aún no sincronizada…): reintentar enseguida no ayuda.
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
