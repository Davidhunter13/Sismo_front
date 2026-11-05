// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { richTextToPlain, sanitizeRichText } from './richText';

describe('sanitizeRichText', () => {
  it('conserva el formato permitido del editor', () => {
    const html = '<p>Hola <strong>Ana</strong>, <em>calma</em> <u>ya</u> <s>no</s></p><ul><li>uno</li></ul><ol><li>dos</li></ol>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('normaliza b, i, strike y br', () => {
    expect(sanitizeRichText('<b>a</b><i>b</i><strike>c</strike><br/>')).toBe('<strong>a</strong><em>b</em><s>c</s><br>');
  });

  it('quita atributos, scripts, imágenes y enlaces', () => {
    const out = sanitizeRichText('<p onclick="x()" style="color:red">a<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">link</a></p>');
    expect(out).toBe('<p>alink</p>');
    expect(out).not.toMatch(/script|onerror|onclick|href|img/i);
  });

  it('elimina iframes, estilos y svg con su contenido', () => {
    expect(sanitizeRichText('<p>x</p><iframe src="//e">y</iframe><style>p{}</style><svg><script>1</script></svg>')).toBe('<p>x</p>');
  });

  it('el texto escapado sigue escapado', () => {
    expect(sanitizeRichText('<p>&lt;script&gt;alert(1)&lt;/script&gt; Ñandú</p>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt; Ñandú</p>');
  });

  it('un mensaje anterior en texto plano se muestra como texto', () => {
    expect(sanitizeRichText('Ya vamos <3 & "listo"\nSegunda línea')).toBe('<p>Ya vamos &lt;3 &amp; &quot;listo&quot;</p><p>Segunda línea</p>');
    expect(sanitizeRichText(null)).toBe('');
  });

  it('cambia los espacios duros por espacios normales', () => {
    expect(sanitizeRichText('<p>x&nbsp;y</p>')).toBe('<p>x y</p>');
  });
});

describe('richTextToPlain', () => {
  it('devuelve solo el texto visible', () => {
    expect(richTextToPlain('<p>Hola <strong>Ana</strong></p><ul><li>uno</li><li>dos</li></ul>')).toBe('Hola Ana uno dos');
  });
});
