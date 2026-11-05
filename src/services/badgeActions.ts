// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import type { AppData } from '../types';
import { daysUntil } from './kitService';
import type { BadgeKey } from './badgeService';

/**
 * Hechos para las insignias que se deducen de un cambio de estado (AppStateProvider los registra en cada cambio,
 * venga de la pantalla que venga: registro, Contactos, Ubicación, Mochila…). Función pura.
 *
 * Nunca registra nada de las alertas en sí (activar, ubicación, correos): solo lo que hace la persona.
 * Los datos de demostración (`isSeed`) no cuentan.
 */
export interface DerivedAction {
  clave: BadgeKey;
  elemento?: string;
}

const kitComplete = (d: AppData, today: Date) => {
  const items = d.kit?.items ?? [];
  return items.length > 0 && items.every((i) => i.checked && !(i.expiresOn && daysUntil(i.expiresOn, today) < 0));
};

/** Pasos de «Después del sismo» marcados (lista de práctica y la de cada alerta). */
function postQuakeSteps(d: AppData): Set<string> {
  const out = new Set<string>(d.postQuakeDone);
  for (const a of d.alerts) for (const s of a.postQuakeDone ?? []) out.add(s);
  return out;
}

export function badgeActionsFromDiff(prev: AppData, next: AppData, today: Date = new Date()): DerivedAction[] {
  if (prev === next) return [];
  const out: DerivedAction[] = [];

  // Contactos nuevos y contacto principal del correo.
  const before = new Map(prev.contacts.filter((c) => !c.isSeed).map((c) => [c.id, c]));
  for (const c of next.contacts) {
    if (c.isSeed) continue;
    const old = before.get(c.id);
    if (!old) out.push({ clave: 'contacto_agregado', elemento: c.id });
    if (c.emailPrimary && !old?.emailPrimary) out.push({ clave: 'contacto_principal' });
  }

  // Puntos de encuentro nuevos.
  const points = new Set(prev.meetingPoints.map((p) => p.id));
  for (const p of next.meetingPoints) if (!points.has(p.id)) out.push({ clave: 'punto_encuentro', elemento: p.id });

  // Ficha médica guardada (nueva o modificada).
  if (next.medical && JSON.stringify(prev.medical) !== JSON.stringify(next.medical)) out.push({ clave: 'ficha_medica' });

  // Mochila: elementos marcados, completa y revisada.
  if (next.kit && prev.kit !== next.kit) {
    const checked = new Set((prev.kit?.items ?? []).filter((i) => i.checked).map((i) => i.id));
    for (const i of next.kit.items) if (i.checked && !checked.has(i.id)) out.push({ clave: 'mochila_item', elemento: i.id });
    if (kitComplete(next, today) && !kitComplete(prev, today)) out.push({ clave: 'mochila_completa' });
    if (next.kit.lastReviewedAt && next.kit.lastReviewedAt !== prev.kit?.lastReviewedAt) out.push({ clave: 'mochila_revisada' });
  }

  // Ajustes.
  const a = prev.settings;
  const b = next.settings;
  if (b.language !== a.language) out.push({ clave: 'cambiar_idioma' });
  if (b.theme !== a.theme) out.push({ clave: 'cambiar_tema' });
  if (b.highContrast && !a.highContrast) out.push({ clave: 'alto_contraste' });
  if (b.fallDetection && !a.fallDetection) out.push({ clave: 'deteccion_caidas' });
  if (b.lowBatterySaver > 0 && a.lowBatterySaver <= 0) out.push({ clave: 'ahorro_bateria' });

  // Encuesta SUS respondida.
  const sus = new Set(prev.susResponses.map((s) => s.id));
  if (next.susResponses.some((s) => !sus.has(s.id))) out.push({ clave: 'encuesta_sus' });

  // Pasos de «Después del sismo» marcados.
  const steps = postQuakeSteps(prev);
  for (const s of postQuakeSteps(next)) if (!steps.has(s)) out.push({ clave: 'post_sismo', elemento: s });

  return out;
}
