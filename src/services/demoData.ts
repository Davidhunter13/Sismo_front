// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AlertRecord, Contact, LocationSnapshot } from '../types';

/**
 * Coordenadas FIJAS de prueba (centro de Bogotá, referencia pública).
 * Nunca representan la posición del usuario y siempre se muestran rotuladas.
 */
export const TEST_COORDINATES = { latitude: 4.6097, longitude: -74.0817 } as const;

export function testLocation(): LocationSnapshot {
  return { ...TEST_COORDINATES, accuracy: undefined, timestamp: new Date().toISOString(), source: 'prueba' };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Contactos ficticios con números no asignables (prefijo 300 000 00xx). */
export function demoContacts(): Contact[] {
  const createdAt = new Date().toISOString();
  return [
    { id: 'demo-c1', name: 'Ana (demo)', relationship: 'Familiar', phone: '300 000 0001', isSeed: true, createdAt },
    { id: 'demo-c2', name: 'Luis (demo)', relationship: 'Vecino/a', phone: '300 000 0002', isSeed: true, createdAt },
    { id: 'demo-c3', name: 'Marta (demo)', relationship: 'Compañero/a de trabajo', phone: '300 000 0003', isSeed: true, createdAt },
  ];
}

/** Historial de ejemplo que cubre todos los estados del canal digital. */
export function demoAlerts(): AlertRecord[] {
  const loc = (h: number): LocationSnapshot => ({ ...TEST_COORDINATES, timestamp: hoursAgo(h), source: 'prueba' });
  return [
    {
      id: 'demo-a1', eventType: 'sismo', status: 'finalizada', activatedAt: hoursAgo(5), endedAt: hoursAgo(4.9),
      location: loc(5), digitalStatus: 'enviada', simulatedDelivery: true, contactsCount: 3, isSeed: true,
      note: 'Registro de ejemplo: entrega simulada a 3 contactos ficticios.',
    },
    {
      id: 'demo-a2', eventType: 'prueba', status: 'finalizada', activatedAt: hoursAgo(28), endedAt: hoursAgo(27.95),
      location: null, digitalStatus: 'fallida', simulatedDelivery: true, contactsCount: 0, isSeed: true,
      note: 'Registro de ejemplo: fallo simulado por no tener contactos configurados.',
    },
    {
      id: 'demo-a3', eventType: 'emergencia_general', status: 'finalizada', activatedAt: hoursAgo(75), endedAt: hoursAgo(74.8),
      location: loc(75), digitalStatus: 'pendiente', simulatedDelivery: true, contactsCount: 2, isSeed: true,
      note: 'Registro de ejemplo: la alerta terminó antes de confirmar la entrega simulada.',
    },
    {
      id: 'demo-a4', eventType: 'sismo', status: 'finalizada', activatedAt: hoursAgo(170), endedAt: hoursAgo(169.7),
      location: null, digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 3, isSeed: true,
      note: 'Registro de ejemplo: alerta solo local, sin canal digital.',
    },
  ];
}
