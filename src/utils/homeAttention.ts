// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { kitStatus } from '../services/kitService';
import type { AlertRecord, AppData, KitItem } from '../types';

/**
 * Qué le falta a la persona para estar preparada, para resaltar las tarjetas de Inicio:
 * - 'pendiente' (amarillo): algo sin hacer (mochila vacía, sin ficha médica, sin simulacro, sin punto de encuentro,
 *   «Después del sismo» sin revisar tras un sismo).
 * - 'urgente' (rojo): algo de la mochila vencido o por vencer.
 * Se calcula con los datos del teléfono (los mismos que se sincronizan con la base de datos): funciona sin internet.
 */
export type Attention = 'pendiente' | 'urgente' | null;

export interface HomeAttention {
  kit: { level: Attention; expired: KitItem[]; expiring: KitItem[]; empty: boolean };
  medical: Attention;
  drill: Attention;
  compass: Attention;
  /** Última alerta real de sismo finalizada cuya lista «Después del sismo» quedó incompleta. */
  postQuake: { level: Attention; alert: AlertRecord | null; done: number; total: number };
}

export function homeAttention(data: AppData, postQuakeTotal: number, today: Date = new Date()): HomeAttention {
  const kit = kitStatus(data.kit, today);
  const kitEmpty = !data.kit || kit.checked === 0;
  const kitLevel: Attention = kit.expired.length || kit.expiringSoon.length ? 'urgente' : kitEmpty || kit.reviewDue ? 'pendiente' : null;

  const real = data.alerts.filter((a) => !a.isSeed);
  const didDrill = real.some((a) => a.isDrill);
  const lastQuake = real
    .filter((a) => !a.isDrill && a.eventType === 'sismo' && a.status === 'finalizada')
    .sort((a, b) => (b.endedAt ?? b.activatedAt).localeCompare(a.endedAt ?? a.activatedAt))[0] ?? null;
  const done = lastQuake?.postQuakeDone?.length ?? 0;
  const pendingPostQuake = !!lastQuake && postQuakeTotal > 0 && done < postQuakeTotal;

  return {
    kit: { level: kitLevel, expired: kit.expired, expiring: kit.expiringSoon, empty: kitEmpty },
    medical: data.medical ? null : 'pendiente',
    drill: didDrill ? null : 'pendiente',
    compass: data.meetingPoints.length ? null : 'pendiente',
    postQuake: { level: pendingPostQuake ? 'pendiente' : null, alert: pendingPostQuake ? lastQuake : null, done, total: postQuakeTotal },
  };
}
