// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { devOrProd, isProduction } from './env';

describe('producción vs. desarrollo', () => {
  it('producción = compilación sin desarrollo ni VITE_DEMO', () => {
    expect(isProduction({ DEV: false })).toBe(true);
    expect(isProduction({ DEV: false, VITE_DEMO: 'false' })).toBe(true);
    expect(isProduction({ DEV: true })).toBe(false);
    // Compilación de pruebas (Playwright) con el modo de demostración habilitado.
    expect(isProduction({ DEV: false, VITE_DEMO: 'true' })).toBe(false);
  });

  it('devOrProd elige el texto según el entorno', () => {
    expect(devOrProd('con demo', 'sin demo', true)).toBe('sin demo');
    expect(devOrProd('con demo', 'sin demo', false)).toBe('con demo');
  });
});
