// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useT } from '../i18n/useT';

/** Icono del proyecto: onda sísmica + punto de alerta. */
export function SismoLogo({ size = 40 }: { size?: number }) {
  const t = useT().components;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={t.logo}>
      <rect width="64" height="64" rx="16" fill="#0B2545" />
      <path d="M8 34h10l5-12 7 22 6-16 4 6h16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="18" r="6" fill="#D62828" />
    </svg>
  );
}
