// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { daysUntil } from '../services/kitService';
import type { ProfileItem } from '../services/badgeService';
import type { AppData } from '../types';

/**
 * «Perfil completado», calculado en el teléfono para que cambie al instante. Usa los mismos 7 puntos que el
 * servidor (Sismo_insignias_model::perfil): nombre, foto, al menos un contacto, un contacto con correo, un punto
 * de encuentro, la ficha médica y la mochila completa (todo marcado y nada vencido). Los datos de demostración
 * no cuentan (nunca llegan al servidor).
 */
export const PROFILE_ITEMS: ProfileItem[] = ['nombre', 'foto', 'contactos', 'correo', 'puntos', 'ficha', 'mochila'];

/** Pantalla donde se completa cada punto. */
export const PROFILE_ROUTES: Record<ProfileItem, string> = {
  nombre: '/configuracion',
  foto: '/configuracion',
  contactos: '/contactos',
  correo: '/contactos',
  puntos: '/ubicacion',
  ficha: '/ficha-medica',
  mochila: '/mochila',
};

export interface ProfileCompletion {
  porcentaje: number;
  items: Record<ProfileItem, boolean>;
  missing: ProfileItem[];
}

export function profileCompletion(data: AppData, photo: boolean, today: Date = new Date()): ProfileCompletion {
  const contacts = data.contacts.filter((c) => !c.isSeed);
  const kitItems = data.kit?.items ?? [];
  const items: Record<ProfileItem, boolean> = {
    nombre: data.settings.userName.trim() !== '',
    foto: photo,
    contactos: contacts.length > 0,
    correo: contacts.some((c) => !!c.email?.trim()),
    puntos: data.meetingPoints.length > 0,
    ficha: data.medical !== null,
    mochila: kitItems.length > 0 && kitItems.every((i) => i.checked && !(i.expiresOn && daysUntil(i.expiresOn, today) < 0)),
  };
  const done = PROFILE_ITEMS.filter((k) => items[k]).length;
  return { porcentaje: Math.round((done * 100) / PROFILE_ITEMS.length), items, missing: PROFILE_ITEMS.filter((k) => !items[k]) };
}
