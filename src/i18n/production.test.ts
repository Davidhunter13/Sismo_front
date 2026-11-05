// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it, vi } from 'vitest';

// Simula una compilación de PRODUCCIÓN (sin modo de demostración) antes de cargar los textos.
vi.mock('../utils/env', () => ({
  DEMO_ENABLED: false,
  IS_PRODUCTION: true,
  isProduction: () => true,
  devOrProd: <T,>(_dev: T, prod: T) => prod,
}));

const FORBIDDEN = /demo|demostraci|prototip|prototype/i;

/**
 * Claves que solo se muestran con el modo de demostración (en producción esas tarjetas, botones y datos ficticios
 * no existen: ver DEMO_ENABLED en Configuración, Bienvenida, Encabezado y datos de ejemplo).
 */
const DEMO_ONLY = [
  /^settings\.demo\./, /^services\.demo\./, /^welcome\.demo/, /^common\.header\.demo/, /^components\.badge\.demo$/,
  /^home\.imSafeDemoOnly$/, /^home\.services\.digitalDemo$/, /^settings\.deleteAll/, /^location\.useTest$/, /^location\.testLoaded$/,
];

function collect(value: unknown, path: string, out: [string, string][]): void {
  if (typeof value === 'string') out.push([path, value]);
  else if (typeof value === 'function') {
    try {
      collect((value as (...a: unknown[]) => unknown)('X', 'Y', 'Z'), path, out);
    } catch {
      // Funciones con argumentos de otro tipo: se omiten.
    }
  } else if (Array.isArray(value)) value.forEach((v, i) => collect(v, `${path}.${i}`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, path ? `${path}.${k}` : k, out);
}

describe('textos en producción', () => {
  it('ningún texto visible en producción dice «demo», «demostración» ni «prototipo» (es y en)', async () => {
    const { getT } = await import('./index');
    for (const lang of ['es', 'en'] as const) {
      const texts: [string, string][] = [];
      collect(getT(lang), '', texts);
      const offending = texts.filter(([k, v]) => FORBIDDEN.test(v) && !DEMO_ONLY.some((re) => re.test(k)));
      expect(offending, `${lang}: ${offending.map(([k]) => k).join(', ')}`).toEqual([]);
    }
  });

  it('Configuración: «Perfil», «Lo que debe saber» actualizado y versión sin «Prototipo»', async () => {
    const { getT } = await import('./index');
    const t = getT('es').settings;
    expect(t.profile.title).toBe('Perfil');
    expect(t.limitationsTitle).toBe('Lo que debe saber');
    expect(t.limitations.join(' ')).toMatch(/copia oculta/);
    expect(t.limitations.join(' ')).not.toMatch(/Enviada/);
    expect(t.version).toBe('SISMO v0.1.0');
    expect(getT('en').settings.version).toBe('SISMO v0.1.0');
  });
});
