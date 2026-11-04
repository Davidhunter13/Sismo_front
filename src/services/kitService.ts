// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLang } from '../i18n';
import { getCatalogs, text } from './catalogService';
import type { EmergencyKit, KitItem } from '../types';
import { newId } from './storageService';

/**
 * Mochila de emergencia: lista base (orientativa; validar contra fuentes oficiales como la UNGRD)
 * y recordatorios dentro de la app para elementos que vencen y para la revisión periódica.
 */
/**
 * Lista base (catálogo administrable) en el idioma activo: se lee al acceder, no al importar el módulo.
 * Reenvía también `has`/`ownKeys`/descriptores porque map, filter, etc. consultan si existe cada índice.
 */
const kitItems = () => getCatalogs().kitItems.map((i) => text(i.label, getLang()));
export const DEFAULT_KIT_ITEMS: readonly string[] = new Proxy([] as string[], {
  get: (_, key) => Reflect.get(kitItems(), key),
  has: (_, key) => Reflect.has(kitItems(), key),
  ownKeys: () => Reflect.ownKeys(kitItems()),
  getOwnPropertyDescriptor: (_, key) => Reflect.getOwnPropertyDescriptor(kitItems(), key),
});

/** Revisión recomendada cada 6 meses. */
export const REVIEW_EVERY_DAYS = 180;
/** Se avisa cuando faltan 30 días o menos para el vencimiento. */
export const EXPIRY_WARNING_DAYS = 30;

export function createDefaultKit(): EmergencyKit {
  return { items: kitItems().map((name): KitItem => ({ id: newId(), name, checked: false, isDefault: true })) };
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
