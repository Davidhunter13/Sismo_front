// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { DeliveryStatus, LocationPermission } from '../types';
import type { BadgeTone } from './StatusBadge';

export const deliveryBadge: Record<DeliveryStatus, { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  enviada: { tone: 'success', label: 'Enviada' },
  fallida: { tone: 'danger', label: 'Fallida' },
  no_disponible: { tone: 'neutral', label: 'Sin canal digital' },
};

export const permissionBadge: Record<LocationPermission, { tone: BadgeTone; label: string }> = {
  concedido: { tone: 'success', label: 'Permiso concedido' },
  denegado: { tone: 'danger', label: 'Permiso denegado' },
  no_disponible: { tone: 'neutral', label: 'No disponible' },
  sin_solicitar: { tone: 'info', label: 'Sin solicitar' },
};
