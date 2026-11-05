// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Modo de demostración (datos ficticios, entrega simulada, accesos para pruebas) disponible SOLO en desarrollo
 * (`npm run dev`). En producción (`npm run build` y el APK) no aparece en ninguna pantalla y queda siempre apagado.
 * Se puede forzar en una compilación de pruebas con VITE_DEMO=true.
 */
export const DEMO_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';

/**
 * ¿Compilación de producción (la que se publica y el APK)? Es lo contrario del modo de demostración: en producción
 * no aparece ningún texto de «demostración», ni el botón «Borrar todos los datos», ni avisos del prototipo.
 * Las compilaciones de pruebas (VITE_DEMO=true, Playwright) y `npm run dev` cuentan como desarrollo.
 * Recibe el entorno como parámetro para poder probarse (env.test.ts).
 */
export function isProduction(env: { DEV?: boolean; VITE_DEMO?: string } = import.meta.env): boolean {
  return !(env.DEV || env.VITE_DEMO === 'true');
}

/** Constante del build actual (equivale a !DEMO_ENABLED). */
export const IS_PRODUCTION: boolean = isProduction();

/** Elige el valor de desarrollo o el de producción (p. ej. textos que mencionan el modo de demostración). */
export function devOrProd<T>(dev: T, prod: T, production: boolean = IS_PRODUCTION): T {
  return production ? prod : dev;
}
