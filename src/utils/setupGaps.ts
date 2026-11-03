// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { defaultSettings } from '../services/storageService';
import type { AppData } from '../types';

export type SetupItem = 'name' | 'location' | 'meeting' | 'contact';

/**
 * Datos necesarios para que SISMO pueda avisar a los contactos que faltan (los mismos 4 del registro).
 * Ocurre si se dio SOS durante el registro sin terminarlo, o si después se borraron datos. En el modo de
 * demostración no se marca nada (los datos de ejemplo son ficticios a propósito).
 */
export function setupGaps(data: AppData): SetupItem[] {
  if (data.settings.demoMode) return [];
  const name = data.settings.userName.trim();
  const gaps: SetupItem[] = [];
  if (!name || name === defaultSettings.userName) gaps.push('name');
  if (data.lastLocation?.source !== 'dispositivo') gaps.push('location');
  if (data.meetingPoints.length === 0) gaps.push('meeting');
  if (!data.contacts.some((c) => !c.isSeed)) gaps.push('contact');
  return gaps;
}
