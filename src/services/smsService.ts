// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLocale, getT } from '../i18n';
import type { Contact, EventType, LocationSnapshot, MedicalInfo, MeetingPoint } from '../types';
import { eventTypeLabel } from '../utils/format';
import { isNative } from './nativeBridge';

/**
 * Canal digital por SMS: abre la app de mensajes del teléfono con destinatarios y texto listos.
 * El usuario confirma el envío en esa app; SISMO no puede saber si el mensaje salió ni si fue entregado.
 * Costo: el del plan del usuario. Funciona aunque los datos móviles estén caídos (solo requiere señal).
 * Los textos salen en el idioma activo de la app (getT().services.sms).
 */

const mapsLink = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

/** Resumen de una línea de la ficha médica; vacío si no hay datos o el usuario desactivó «Compartir». */
export function medicalSummary(medical: MedicalInfo | null): string {
  if (!medical?.showOnAlert) return '';
  const t = getT().services.sms;
  const parts = [
    medical.bloodType && t.blood(medical.bloodType),
    medical.allergies && t.allergies(medical.allergies),
    medical.medications && t.medications(medical.medications),
    medical.conditions && t.conditions(medical.conditions),
    medical.notes && t.notes(medical.notes),
  ].filter(Boolean);
  return parts.join('. ');
}

export function buildAlertMessage(
  userName: string,
  eventType: EventType,
  location: LocationSnapshot | null,
  meetingPoint: MeetingPoint | null = null,
  medical: MedicalInfo | null = null,
  batteryLevel: number | null = null,
): string {
  const t = getT().services.sms;
  const who = userName.trim() || t.defaultWho;
  const lines = [t.alertHeader(who, eventTypeLabel[eventType])];
  if (location) {
    const precision = location.accuracy != null ? ` (±${Math.round(location.accuracy)} m)` : '';
    const link = mapsLink(location.latitude, location.longitude);
    lines.push(location.source === 'prueba' ? t.testLocation(link) : t.location(precision, link));
  } else {
    lines.push(t.noLocation);
  }
  if (meetingPoint) {
    lines.push(t.meetingPoint(meetingPoint.label, mapsLink(meetingPoint.latitude, meetingPoint.longitude)));
  }
  const med = medicalSummary(medical);
  if (med) lines.push(t.medical(med));
  // Les dice a los contactos cuánto tiempo queda para comunicarse.
  if (batteryLevel != null) lines.push(t.battery(batteryLevel));
  lines.push(t.callToAction);
  return lines.join('\n');
}

/**
 * Aviso de que la persona está a salvo: al finalizar una alerta (con `eventType`) o en cualquier momento
 * desde el panel principal, por ejemplo después de un temblor (sin `eventType`).
 */
export function buildSafeMessage(userName: string, eventType?: EventType, at: Date = new Date()): string {
  const t = getT().services.sms;
  const who = userName.trim() || t.defaultSafeWho;
  const hour = at.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
  return eventType ? t.safeAfterAlert(who, eventTypeLabel[eventType], hour) : t.safeNow(who, hour);
}

/**
 * Número en el formato que exige WhatsApp (wa.me): código de país y solo dígitos, sin «+».
 * Si se guardó un celular colombiano sin indicativo (10 dígitos que empiezan por 3), se antepone 57;
 * por eso «3203498531» y «+57 320 349 8531» abren el mismo chat.
 */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}

export function buildWhatsappUrl(contact: Contact, body: string): string {
  return `https://wa.me/${whatsappNumber(contact.phone)}?text=${encodeURIComponent(body)}`;
}

/**
 * Abre WhatsApp con el chat del contacto y el mensaje listo (un contacto por vez: WhatsApp no permite
 * varios destinatarios en un enlace). Requiere internet; el usuario confirma el envío en WhatsApp.
 */
export function openWhatsapp(contact: Contact, body: string): void {
  const url = buildWhatsappUrl(contact, body);
  // En la app nativa la navegación a wa.me la recibe el sistema y abre WhatsApp; en el navegador, otra pestaña.
  if (isNative()) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

/** Deja solo dígitos y el "+" inicial, que es lo que entiende el esquema sms:. */
function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, '');
}

export function buildSmsUrl(contacts: Contact[], body: string): string {
  const recipients = contacts.map((c) => normalizePhone(c.phone)).filter(Boolean).join(',');
  // Android acepta varios destinatarios separados por coma (RFC 5724).
  return `sms:${recipients}?body=${encodeURIComponent(body)}`;
}

/** Abre la app de SMS. En la app nativa Capacitor entrega el enlace sms: al sistema. */
export function openSmsComposer(contacts: Contact[], body: string): void {
  window.location.href = buildSmsUrl(contacts, body);
}
