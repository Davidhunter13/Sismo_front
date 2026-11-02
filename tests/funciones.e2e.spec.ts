// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { activateAlert, goTo, onboard, readStorage, view } from './helpers';

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  // Catálogo del USGS simulado: las pruebas no dependen de internet.
  await page.route('https://earthquake.usgs.gov/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            id: 'us-prueba-1',
            properties: { mag: 4.8, place: '20 km al norte de Bucaramanga', time: Date.now() - 3_600_000, url: 'https://earthquake.usgs.gov/x' },
            geometry: { coordinates: [-73.1, 7.3, 150] },
          },
          {
            id: 'us-lejos',
            properties: { mag: 5.5, place: 'Japón', time: Date.now(), url: 'https://earthquake.usgs.gov/y' },
            geometry: { coordinates: [139.7, 35.6, 10] },
          },
        ],
      }),
    }),
  );
});

test.afterEach(() => {
  expect(consoleErrors, 'errores de consola').toEqual([]);
});

test('las páginas nuevas cargan', async ({ page }) => {
  await onboard(page);
  const routes: [string, string][] = [
    ['/estadisticas', 'Estadísticas'],
    ['/simulacro', 'Simulacro'],
    ['/ficha-medica', 'Ficha médica'],
    ['/sismos', 'Sismos recientes'],
  ];
  for (const [path, title] of routes) await goTo(page, path, title);
});

test('sismos recientes: muestra solo los de Colombia sin ubicación', async ({ page }) => {
  await onboard(page);
  await goTo(page, '/sismos', 'Sismos recientes');
  const rows = view(page).locator('.quake-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Bucaramanga');
  await expect(rows.first().locator('.quake-mag')).toHaveText('4.8');
});

test('alerta: botón 123 y métricas de activación', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  await expect(view(page).getByRole('link', { name: 'Llamar al 123' })).toHaveAttribute('href', 'tel:123');
  const alert = (await readStorage(page)).alerts[0];
  expect(alert.metrics.sosPressedAt).toEqual(expect.any(Number));
  expect(alert.metrics.confirmedAt).toBeGreaterThanOrEqual(alert.metrics.sosPressedAt);
  expect(alert).toMatchObject({ isDrill: false, source: 'app' });
});

test('simulacro: da la señal y registra el tiempo de reacción', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/simulacro', 'Simulacro');
  await view(page).getByRole('button', { name: 'Comenzar simulacro' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(view(page).getByText('¡SISMO! Active la alerta ahora')).toBeVisible({ timeout: 12_000 });
  await activateAlert(page);
  await expect(view(page).getByText(/Simulacro · reacción/)).toBeVisible();
  const alert = (await readStorage(page)).alerts[0];
  expect(alert.isDrill).toBe(true);
  expect(alert.metrics.confirmedAt).toBeGreaterThan(alert.metrics.drillSignalAt);
});

test('ficha médica: compartida por defecto en la alerta; se puede desactivar', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/ficha-medica', 'Ficha médica');
  const v = view(page);
  await v.locator('ion-input').filter({ hasText: 'Alergias' }).locator('input').fill('Penicilina');
  await v.getByRole('button', { name: 'Guardar ficha' }).click();
  expect((await readStorage(page)).medical).toMatchObject({ allergies: 'Penicilina', showOnAlert: true });

  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  await expect(view(page).locator('.medical-card')).toContainText('Penicilina');
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/inicio$/);

  // El usuario desactiva «Compartir»: deja de mostrarse.
  await goTo(page, '/ficha-medica', 'Ficha médica');
  await view(page).getByRole('switch', { name: 'Compartir en la alerta y en el SMS' }).click();
  await view(page).getByRole('button', { name: 'Guardar ficha' }).click();
  expect((await readStorage(page)).medical.showOnAlert).toBe(false);
  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  await expect(view(page).locator('.medical-card')).toHaveCount(0);
});

test('estadísticas: cuenta alertas y exporta CSV sin datos personales', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/inicio$/);

  await goTo(page, '/estadisticas', 'Estadísticas');
  await expect(view(page).locator('.stat-tile').first()).toContainText('1');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    view(page).getByRole('button', { name: 'Exportar CSV' }).click(),
  ]);
  const csv = await (await download.createReadStream()).toArray();
  const text = Buffer.concat(csv).toString('utf8');
  expect(text).toContain('decision_ms');
  expect(text).not.toMatch(/latitude|longitude|Usuario demo/);
});
