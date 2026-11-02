// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { EmergencyKit, KitItem } from '../types';
import { newId } from './storageService';

/**
 * Mochila de emergencia: lista base (orientativa; validar contra fuentes oficiales como la UNGRD)
 * y recordatorios dentro de la app para elementos que vencen y para la revisión periódica.
 */
export const DEFAULT_KIT_ITEMS = [
  'Agua potable (3 litros por persona al día, para 3 días)',
  'Alimentos no perecederos',
  'Linterna',
  'Pilas de repuesto',
  'Radio de pilas',
  'Silbato',
  'Botiquín de primeros auxilios',
  'Medicamentos de uso personal',
  'Copia de documentos de identidad',
  'Dinero en efectivo',
  'Cargador portátil (power bank)',
  'Ropa abrigada y manta térmica',
  'Tapabocas y elementos de aseo',
];

/** Revisión recomendada cada 6 meses. */
export const REVIEW_EVERY_DAYS = 180;
/** Se avisa cuando faltan 30 días o menos para el vencimiento. */
export const EXPIRY_WARNING_DAYS = 30;

export function createDefaultKit(): EmergencyKit {
  return { items: DEFAULT_KIT_ITEMS.map((name): KitItem => ({ id: newId(), name, checked: false, isDefault: true })) };
}

const DAY = 86_400_000;

/** Días hasta el vencimiento (negativo si ya venció), contando por fecha local. */
export function daysUntil(dateIso: string, today: Date = new Date()): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - base) / DAY);
}

export interface KitStatus {
  checked: number;
  total: number;
  expired: KitItem[];
  expiringSoon: KitItem[];
  reviewDue: boolean;
}

export function kitStatus(kit: EmergencyKit | null, today: Date = new Date()): KitStatus {
  const items = kit?.items ?? [];
  const withDate = items.filter((i) => i.expiresOn);
  const expired = withDate.filter((i) => daysUntil(i.expiresOn as string, today) < 0);
  const expiringSoon = withDate.filter((i) => {
    const d = daysUntil(i.expiresOn as string, today);
    return d >= 0 && d <= EXPIRY_WARNING_DAYS;
  });
  const reviewDue = !kit?.lastReviewedAt || today.getTime() - new Date(kit.lastReviewedAt).getTime() > REVIEW_EVERY_DAYS * DAY;
  return { checked: items.filter((i) => i.checked).length, total: items.length, expired, expiringSoon, reviewDue };
}
