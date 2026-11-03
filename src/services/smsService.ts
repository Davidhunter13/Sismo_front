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
  meetingPoints: MeetingPoint[] = [],
  medical: MedicalInfo | null = null,
  batteryLevel: number | null = null,
): string {
  const t = getT().services.sms;
  const who = userName.trim() || t.defaultWho;
  const lines = [t.alertHeader(who, eventTypeLabel[eventType]), locationLine(location), ...meetingLines(meetingPoints)];
  const med = medicalSummary(medical);
  if (med) lines.push(t.medical(med));
  // Les dice a los contactos cuánto tiempo queda para comunicarse.
  if (batteryLevel != null) lines.push(t.battery(batteryLevel));
  lines.push(t.callToAction);
  return lines.join('\n');
}

/** Línea con la ubicación (enlace a Google Maps y precisión), compartida por el aviso de alerta y «Estoy bien». */
function locationLine(location: LocationSnapshot | null): string {
  const t = getT().services.sms;
  if (!location) return t.noLocation;
  const precision = location.accuracy != null ? ` (±${Math.round(location.accuracy)} m)` : '';
  const link = mapsLink(location.latitude, location.longitude);
  return location.source === 'prueba' ? t.testLocation(link) : t.location(precision, link);
}

/** Una línea por punto de encuentro, cada una con su enlace a Google Maps. */
function meetingLines(meetingPoints: MeetingPoint[]): string[] {
  const t = getT().services.sms;
  return meetingPoints.map((p) => t.meetingPoint(p.label, mapsLink(p.latitude, p.longitude)));
}

/** Datos opcionales del aviso «Estoy bien»: dónde está la persona, los puntos de encuentro y la batería. */
export interface SafeDetails {
  location?: LocationSnapshot | null;
  meetingPoints?: MeetingPoint[];
  batteryLevel?: number | null;
}

/**
 * Aviso de que la persona está a salvo: al finalizar una alerta (con `eventType`) o en cualquier momento
 * desde el panel principal, por ejemplo después de un temblor (sin `eventType`).
 */
export function buildSafeMessage(userName: string, eventType?: EventType, at: Date = new Date(), details: SafeDetails = {}): string {
  const t = getT().services.sms;
  const who = userName.trim() || t.defaultSafeWho;
  const hour = at.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
  const lines = [eventType ? t.safeAfterAlert(who, eventTypeLabel[eventType], hour) : t.safeNow(who, hour)];
  // Mensaje completo: dónde está, los puntos de encuentro y la batería (si se conocen).
  if (details.location !== undefined) lines.push(locationLine(details.location));
  lines.push(...meetingLines(details.meetingPoints ?? []));
  if (details.batteryLevel != null) lines.push(t.battery(details.batteryLevel));
  return lines.join('\n');
}

/**
 * Aviso de batería baja durante una alerta (cuando el teléfono pasa solo al modo ahorro): nivel, última
 * ubicación conocida y puntos de encuentro, por si la persona se queda sin comunicación.
 */
export function buildLowBatteryMessage(
  userName: string,
  level: number,
  location: LocationSnapshot | null,
  meetingPoints: MeetingPoint[] = [],
): string {
  const t = getT().services.sms;
  const who = userName.trim() || t.defaultWho;
  return [t.lowBattery(who, level), locationLine(location), ...meetingLines(meetingPoints), t.callToAction].join('\n');
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

/**
 * Deja solo dígitos y el "+" inicial, que es lo que entiende el esquema sms:. A los celulares colombianos
 * guardados sin indicativo (10 dígitos que empiezan por 3) se les agrega +57: en algunos teléfonos el enlace
 * sms: lo atiende WhatsApp, que sin el código de país dice que el número no existe.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('3')) return `+57${digits}`;
  return digits;
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
