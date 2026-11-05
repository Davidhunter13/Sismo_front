// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { evaluateVersion, parseVersion, type PublishedVersion } from './versionService';

const v = (actual: number, minima: number): PublishedVersion => ({ actual, minima, nombre: '1.0', enlace: 'https://x.test/apk', tienda: false });

describe('evaluateVersion', () => {
  it('sin versión publicada o fuera de Android no avisa', () => {
    expect(evaluateVersion(1, null)).toBe('ok');
    expect(evaluateVersion(0, v(5, 5))).toBe('ok');
  });
  it('al día no avisa', () => {
    expect(evaluateVersion(3, v(3, 1))).toBe('ok');
    expect(evaluateVersion(4, v(3, 1))).toBe('ok');
  });
  it('más vieja que la actual: aviso que se puede cerrar', () => {
    expect(evaluateVersion(2, v(3, 1))).toBe('sugerida');
  });
  it('«Ahora no» oculta solo esa versión', () => {
    expect(evaluateVersion(2, v(3, 1), 3)).toBe('ok');
    expect(evaluateVersion(2, v(4, 1), 3)).toBe('sugerida');
  });
  it('más vieja que la mínima: obligatoria, aunque se haya omitido', () => {
    expect(evaluateVersion(1, v(3, 2))).toBe('obligatoria');
    expect(evaluateVersion(1, v(3, 2), 3)).toBe('obligatoria');
  });
});

describe('parseVersion', () => {
  it('acepta la respuesta del backend', () => {
    expect(parseVersion({ actual: 2, minima: 1, nombre: '1.1', enlace: 'https://s.test/Sismo_info/android', tienda: false })).toEqual({
      actual: 2, minima: 1, nombre: '1.1', enlace: 'https://s.test/Sismo_info/android', tienda: false,
    });
  });
  it('rechaza enlaces que no son http(s) y datos incompletos', () => {
    expect(parseVersion({ actual: 2, minima: 1, enlace: 'javascript:alert(1)' })).toBeNull();
    expect(parseVersion({ actual: 'x', minima: 1, enlace: 'https://a.test' })).toBeNull();
    expect(parseVersion(null)).toBeNull();
  });
});
