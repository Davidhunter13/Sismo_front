// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },
  // Se prueba la compilación de producción servida con `vite preview`.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
    // Las pruebas usan el modo de demostración, que en producción está oculto: se habilita solo para esta compilación.
    // Sin servidor de sincronización: las pruebas no dependen del backend.
    env: { VITE_DEMO: 'true', VITE_SISMO_API_URL: '' },
  },
  projects: [
    {
      name: 'movil',
      testMatch: /e2e\.spec\.ts/,
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'escritorio',
      testMatch: /e2e\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium' },
    },
    {
      name: 'capturas',
      testMatch: /screenshots\.spec\.ts/,
      use: { browserName: 'chromium' },
    },
  ],
});
