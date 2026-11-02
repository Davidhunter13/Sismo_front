// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { Contact, EventType, LocationSnapshot } from '../types';
import { eventTypeLabel } from '../utils/format';

/**
 * Canal digital por SMS: abre la app de mensajes del teléfono con destinatarios y texto listos.
 * El usuario confirma el envío en esa app; SISMO no puede saber si el mensaje salió ni si fue entregado.
 * Costo: el del plan del usuario. Funciona aunque los datos móviles estén caídos (solo requiere señal).
 */

export function buildAlertMessage(userName: string, eventType: EventType, location: LocationSnapshot | null): string {
  const who = userName.trim() || 'Un contacto suyo';
  const lines = [`ALERTA SISMO: ${who} activó una alerta (${eventTypeLabel[eventType]}).`];
  if (location) {
    const lat = location.latitude.toFixed(5);
    const lng = location.longitude.toFixed(5);
    const precision = location.accuracy != null ? ` (±${Math.round(location.accuracy)} m)` : '';
    lines.push(
      location.source === 'prueba'
        ? `Ubicación de PRUEBA, no es real: https://maps.google.com/?q=${lat},${lng}`
        : `Ubicación${precision}: https://maps.google.com/?q=${lat},${lng}`,
    );
  } else {
    lines.push('Ubicación no disponible.');
  }
  lines.push('Si puede, comuníquese o llame a la línea 123.');
  return lines.join('\n');
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
