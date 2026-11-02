// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Contact, EventType, LocationSnapshot, MedicalInfo, MeetingPoint } from '../types';
import { eventTypeLabel } from '../utils/format';

/**
 * Canal digital por SMS: abre la app de mensajes del teléfono con destinatarios y texto listos.
 * El usuario confirma el envío en esa app; SISMO no puede saber si el mensaje salió ni si fue entregado.
 * Costo: el del plan del usuario. Funciona aunque los datos móviles estén caídos (solo requiere señal).
 */

const mapsLink = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

/** Resumen de una línea de la ficha médica; vacío si no hay datos o el usuario desactivó «Compartir». */
export function medicalSummary(medical: MedicalInfo | null): string {
  if (!medical?.showOnAlert) return '';
  const parts = [
    medical.bloodType && `Sangre ${medical.bloodType}`,
    medical.allergies && `Alergias: ${medical.allergies}`,
    medical.medications && `Medicamentos: ${medical.medications}`,
    medical.conditions && `Condiciones: ${medical.conditions}`,
    medical.notes && `Notas: ${medical.notes}`,
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
  const who = userName.trim() || 'Un contacto suyo';
  const lines = [`ALERTA SISMO: ${who} activó una alerta (${eventTypeLabel[eventType]}).`];
  if (location) {
    const precision = location.accuracy != null ? ` (±${Math.round(location.accuracy)} m)` : '';
    lines.push(
      location.source === 'prueba'
        ? `Ubicación de PRUEBA, no es real: ${mapsLink(location.latitude, location.longitude)}`
        : `Ubicación${precision}: ${mapsLink(location.latitude, location.longitude)}`,
    );
  } else {
    lines.push('Ubicación no disponible.');
  }
  if (meetingPoint) {
    lines.push(`Punto de encuentro: ${meetingPoint.label} ${mapsLink(meetingPoint.latitude, meetingPoint.longitude)}`);
  }
  const med = medicalSummary(medical);
  if (med) lines.push(`Info médica: ${med}`);
  // Les dice a los contactos cuánto tiempo queda para comunicarse.
  if (batteryLevel != null) lines.push(`Batería: ${batteryLevel} %`);
  lines.push('Si puede, comuníquese o llame a la línea 123.');
  return lines.join('\n');
}

/**
 * Aviso de que la persona está a salvo: al finalizar una alerta (con `eventType`) o en cualquier momento
 * desde el panel principal, por ejemplo después de un temblor (sin `eventType`).
 */
export function buildSafeMessage(userName: string, eventType?: EventType, at: Date = new Date()): string {
  const who = userName.trim() || 'Su contacto';
  const hour = at.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return eventType
    ? `SISMO: ${who} está a salvo. La alerta (${eventTypeLabel[eventType]}) finalizó a las ${hour}.`
    : `SISMO: ${who} está bien. Aviso enviado a las ${hour}.`;
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
