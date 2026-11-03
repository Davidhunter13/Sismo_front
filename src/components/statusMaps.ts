// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getT } from '../i18n';
import type { DeliveryStatus, LocationPermission } from '../types';
import type { BadgeTone } from './StatusBadge';

const deliveryTone: Record<DeliveryStatus, BadgeTone> = {
  pendiente: 'warning',
  enviada: 'success',
  fallida: 'danger',
  no_disponible: 'neutral',
  sms_abierto: 'info',
};

const permissionTone: Record<LocationPermission, BadgeTone> = {
  concedido: 'success',
  denegado: 'danger',
  no_disponible: 'neutral',
  sin_solicitar: 'info',
};

/** Tono fijo + texto en el idioma activo (se lee en el momento de usarse). */
function localized<K extends string>(tones: Record<K, BadgeTone>, label: (k: K) => string) {
  return new Proxy({} as Record<K, { tone: BadgeTone; label: string }>, {
    get: (_, key) => ({ tone: tones[key as K], label: label(key as K) }),
  });
}

export const deliveryBadge = localized(deliveryTone, (k) => getT().labels.delivery[k]);
export const permissionBadge = localized(permissionTone, (k) => getT().labels.permission[k]);
