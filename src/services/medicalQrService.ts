// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import QRCode from 'qrcode';
import { getT } from '../i18n';
import type { MedicalInfo } from '../types';

/**
 * QR médico para rescatistas: contiene la ficha en texto plano, así cualquier lector de QR la muestra
 * sin internet ni app. Solo se genera si el usuario mantiene activo «Compartir».
 */
export function medicalQrText(userName: string, medical: MedicalInfo): string {
  const t = getT().features.medicalQr;
  const lines = [t.qrHeader];
  if (userName.trim()) lines.push(`${t.name}: ${userName.trim()}`);
  if (medical.bloodType) lines.push(`${t.blood}: ${medical.bloodType}`);
  if (medical.allergies) lines.push(`${t.allergies}: ${medical.allergies}`);
  if (medical.medications) lines.push(`${t.medications}: ${medical.medications}`);
  if (medical.conditions) lines.push(`${t.conditions}: ${medical.conditions}`);
  if (medical.notes) lines.push(`${t.notes}: ${medical.notes}`);
  lines.push(t.emergency);
  return lines.join('\n');
}

/** Imagen PNG (data URL) del QR. Corrección de errores media: tolera pantallas rayadas o reflejos. */
export function medicalQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 2, width: 280 });
}
