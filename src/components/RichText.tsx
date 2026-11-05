// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useMemo } from 'react';
import { sanitizeRichText } from '../utils/richText';

/**
 * Muestra un mensaje del centro de monitoreo con el mismo formato del editor del panel (negrilla, cursiva,
 * subrayado, tachado y listas). El HTML pasa siempre por la lista blanca de `sanitizeRichText`.
 */
export function RichText({ html, className = '' }: { html: string; className?: string }) {
  const safe = useMemo(() => sanitizeRichText(html), [html]);
  if (!safe) return null;
  // HTML limpio con lista blanca estricta (solo p, br, strong, em, u, s, ul, ol, li, sin atributos).
  return <div className={`rich-text ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safe }} />;
}
