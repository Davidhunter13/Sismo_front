// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Mensajes con texto enriquecido del centro de monitoreo (editor del panel).
 *
 * Lista blanca estricta, igual a la del servidor: p, br, strong, em, u, s, ul, ol, li, SIN atributos
 * (b → strong, i → em, strike/del → s). Cualquier otra etiqueta se quita y su texto se conserva; las peligrosas
 * (script, style, iframe…) se quitan con su contenido. El resultado es seguro para `dangerouslySetInnerHTML`:
 * solo contiene esas etiquetas sin atributos y texto con `<` y `>` escapados.
 * No depende del DOM (funciona igual en el navegador, en Android y en las pruebas).
 */

const ALLOWED: Record<string, string> = {
  p: 'p', br: 'br', strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'u', s: 's', strike: 's', del: 's', ul: 'ul', ol: 'ol', li: 'li',
};
const DANGEROUS = /<(script|style|iframe|object|embed|svg|math|template|noscript|textarea|title|select|button)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HAS_TAG = /<\/?[a-z][^>]*>/i;
const TOKEN = /<!--[\s\S]*?-->|<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

const escapeText = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAll = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML seguro del mensaje. Un texto sin etiquetas (mensajes anteriores) se muestra como texto: un párrafo por línea. */
export function sanitizeRichText(input: string | null | undefined): string {
  const raw = String(input ?? '');
  if (!HAS_TAG.test(raw)) {
    return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => `<p>${escapeAll(line)}</p>`).join('');
  }
  const cleaned = raw.replace(DANGEROUS, '');
  let out = '';
  let last = 0;
  for (const match of cleaned.matchAll(TOKEN)) {
    out += escapeText(cleaned.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;
    const name = match[1]?.toLowerCase();
    const tag = name ? ALLOWED[name] : undefined;
    if (!tag) continue; // comentarios y etiquetas no permitidas: fuera (su texto queda)
    if (tag === 'br') out += '<br>';
    else out += match[0].startsWith('</') ? `</${tag}>` : `<${tag}>`;
  }
  out += escapeText(cleaned.slice(last));
  return out.replace(/&nbsp;/g, ' ');
}

/** Texto visible (sin etiquetas) del mensaje, p. ej. para lectores de pantalla o comparar cambios. */
export function richTextToPlain(input: string | null | undefined): string {
  return sanitizeRichText(input)
    .replace(/<br>|<\/p>|<\/li>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
