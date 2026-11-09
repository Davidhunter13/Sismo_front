// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { activateAlert, goTo, onboard, readStorage, view } from './helpers';

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  // Batería simulada al 100 % (cargando): las pruebas no dependen de la batería real del equipo, que bajo el
  // umbral activaría solo el ahorro automático y cambiaría la pantalla de alerta. bateria.e2e cubre ese caso.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getBattery', { value: async () => ({ level: 1, charging: true, addEventListener() {}, removeEventListener() {} }), configurable: true });
  });
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
    ['/encuesta', 'Encuesta de usabilidad'],
    ['/mochila', 'Mochila de emergencia'],
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

test('sismos recientes: «Todo el mundo» muestra los de cualquier país, con mapa', async ({ page }) => {
  await onboard(page);
  await goTo(page, '/sismos', 'Sismos recientes');
  const v = view(page);
  await expect(v.locator('.quake-row')).toHaveCount(1);
  const mundo = v.getByRole('button', { name: 'Todo el mundo' });
  await mundo.click();
  await expect(mundo).toHaveAttribute('aria-pressed', 'true');
  await expect(v.getByText('Sismos de magnitud 4,5 o mayor en todo el mundo.')).toBeVisible();
  const rows = v.locator('.quake-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Japón');
  await expect(v.locator('.quake-map .quake-pin')).toHaveCount(2);
  await v.getByRole('button', { name: 'Cerca de mí' }).click();
  await expect(rows).toHaveCount(1);
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

test('SOS toma la ubicación automáticamente aunque no haya una guardada', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 15 });
  await onboard(page, false);
  expect((await readStorage(page)).lastLocation).toBeNull();
  await activateAlert(page);
  await expect.poll(async () => (await readStorage(page)).alerts[0].location?.latitude, { timeout: 15_000 }).toBe(4.65);
  expect((await readStorage(page)).locationPermission).toBe('concedido');
});

test('modo atrapado: al salir se retoman las señales normales', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  const v = view(page);
  await v.getByRole('button', { name: 'Activar modo atrapado' }).click();
  await expect(v.getByRole('button', { name: 'Reactivar sirena' })).toBeDisabled();
  await v.getByRole('button', { name: 'Salir del modo atrapado' }).click();
  await expect(v.getByRole('button', { name: 'Silenciar sirena' })).toBeEnabled();
  await expect(v.locator('.alert-hero--flash')).toHaveCount(1);
});

test('simulacro: da la señal y registra el tiempo de reacción', async ({ page }) => {
  await onboard(page, false);
  // Se entra desde el acceso rápido de Inicio (Inicio queda debajo en la pila de vistas).
  await view(page).locator('.quick-tile', { hasText: 'Simulacro' }).click();
  await expect(page).toHaveURL(/\/simulacro$/);
  await page.waitForTimeout(450);
  await view(page).getByRole('button', { name: 'Comenzar simulacro' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  // El aviso del simulacro (no el texto de las instrucciones, que dice lo mismo).
  await expect(view(page).locator('.drill-banner--go')).toBeVisible({ timeout: 12_000 });
  await activateAlert(page);
  await expect(view(page).getByText(/Simulacro · reacción/)).toBeVisible();
  const alert = (await readStorage(page)).alerts[0];
  expect(alert.isDrill).toBe(true);
  expect(alert.metrics.confirmedAt).toBeGreaterThan(alert.metrics.drillSignalAt);

  // Al finalizar un simulacro se abre la encuesta SUS.
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/encuesta\?alerta=/);
});

test('encuesta SUS: calcula y guarda el puntaje', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/encuesta', 'Encuesta de usabilidad');
  const v = view(page);
  const send = v.getByRole('button', { name: /Enviar respuestas/ });
  await expect(send).toBeDisabled();
  // 4 en las afirmaciones impares y 2 en las pares → 75.
  for (let i = 1; i <= 10; i++) {
    await v.getByRole('radiogroup', { name: `Afirmación ${i}` }).locator('.sus-option').nth(i % 2 ? 3 : 1).click();
  }
  await send.click();
  await expect(v.getByRole('heading', { name: 'Puntaje SUS: 75' })).toBeVisible();
  expect((await readStorage(page)).susResponses[0]).toMatchObject({ score: 75 });
});

test('mochila: lista base, vencimientos y aviso en el inicio', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/mochila', 'Mochila de emergencia');
  const v = view(page);
  await expect(v.locator('.kit-item')).toHaveCount(13);
  await v.locator('.kit-item').first().locator('input[type="date"]').fill('2020-01-01');
  await expect(v.locator('.kit-item').first()).toContainText('Vencido');
  await expect(v.getByText(/Revise y reemplace/)).toBeVisible();
  await goTo(page, '/inicio', 'Panel principal');
  // Algo vencido: la tarjeta de la mochila se pone roja y dice qué se venció.
  await expect(view(page).locator('.quick-tile--missing', { hasText: 'Mochila' })).toContainText('Vencido:');
});

test('modo atrapado: pausa las señales continuas', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  const v = view(page);
  await v.getByRole('button', { name: 'Activar modo atrapado' }).click();
  await expect(v.getByRole('button', { name: 'Salir del modo atrapado' })).toBeVisible();
  await expect(v.getByRole('button', { name: /sirena$/ })).toBeDisabled();
  await v.getByRole('button', { name: 'Salir del modo atrapado' }).click();
  await expect(v.getByRole('button', { name: 'Activar modo atrapado' })).toBeVisible();
});

test('detección de caídas: pregunta «¿Está bien?» y permite pedir ayuda', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  await view(page).getByRole('switch', { name: 'Detección de caídas' }).click();
  // Esperar a que se guarde antes de recargar la página.
  await expect.poll(async () => (await readStorage(page)).settings.fallDetection).toBe(true);
  await goTo(page, '/inicio', 'Panel principal');

  const fall = () =>
    page.evaluate(() => {
      const fire = (z: number) =>
        window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: 0, y: 0, z } }));
      fire(0.5); // caída libre
      fire(30); // impacto
    });

  await fall();
  const dialog = page.getByRole('alertdialog', { name: '¿Está bien?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Pedir ayuda ahora' }).click();
  await expect(page).toHaveURL(/\/alerta$/);
  expect((await readStorage(page)).alerts[0]).toMatchObject({ source: 'deteccion_automatica', eventType: 'emergencia_general' });
});

test('navegación: engranaje y luego la casita vuelve al inicio desde cualquier pestaña', async ({ page }) => {
  await onboard(page);
  for (const [tab, url] of [['Inicio', /\/inicio$/], ['Ubicación', /\/ubicacion$/], ['Guía', /\/guia$/]] as const) {
    if (tab !== 'Inicio') {
      await view(page).locator('.bottom-nav').getByRole('button', { name: tab, exact: true }).click();
      await expect(page).toHaveURL(url);
      await page.waitForTimeout(450);
    }
    await view(page).getByRole('button', { name: 'Configuración' }).click();
    await expect(page).toHaveURL(/\/configuracion$/);
    await page.waitForTimeout(450);
    await view(page).locator('.bottom-nav').getByRole('button', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(/\/inicio$/);
    await page.waitForTimeout(450);
    await expect(view(page).locator('.app-header__subtitle')).toHaveText('Panel principal');
  }
});

test('navegación: desde una página secundaria la casita vuelve al inicio y no deja vistas superpuestas', async ({ page }) => {
  await onboard(page);
  for (const tile of ['Simulacro', 'Estadísticas', 'Mochila']) {
    await view(page).locator('.quick-tile', { hasText: tile }).click();
    await page.waitForTimeout(450);
    await view(page).locator('.bottom-nav').getByRole('button', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(/\/inicio$/);
    await page.waitForTimeout(450);
    await expect(view(page).locator('.app-header__subtitle')).toHaveText('Panel principal');
    // Solo una vista visible dentro del enrutador.
    await expect(page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)')).toHaveCount(1);
  }
});

test('configuración: se puede escuchar cada sonido antes de elegirlo', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  const v = view(page);
  await v.getByRole('button', { name: 'Escuchar Sirena' }).click();
  const stop = v.getByRole('button', { name: 'Detener muestra de Sirena' });
  await expect(stop).toBeVisible();
  // La muestra de sirena dura 3 s y se detiene sola.
  await expect(v.getByRole('button', { name: 'Escuchar Sirena' })).toBeVisible({ timeout: 6000 });
  // Detener manualmente la muestra del silbato.
  await v.getByRole('button', { name: 'Escuchar Silbato' }).click();
  await v.getByRole('button', { name: 'Detener muestra de Silbato' }).click();
  await expect(v.getByRole('button', { name: 'Escuchar Silbato' })).toBeVisible();
});

test('inicio: «Avisar que estoy bien» requiere contactos reales', async ({ page }) => {
  await onboard(page); // modo demo: solo contactos ficticios
  await expect(view(page).getByRole('button', { name: 'Avisar que estoy bien' })).toBeDisabled();
  // Explica por qué y ofrece agregar un contacto real.
  await expect(view(page).getByText(/Bloqueado: sus contactos son de demostración/)).toBeVisible();
  await view(page).getByRole('button', { name: 'Agregar un contacto real' }).click();
  await expect(page).toHaveURL(/\/contactos$/);
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
  await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);

  // El usuario desactiva «Compartir»: deja de mostrarse.
  await goTo(page, '/ficha-medica', 'Ficha médica');
  await view(page).getByRole('switch', { name: 'Compartir en la alerta y en el SMS' }).click();
  await view(page).getByRole('button', { name: 'Guardar ficha' }).click();
  await expect.poll(async () => (await readStorage(page)).medical.showOnAlert).toBe(false);
  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  await expect(view(page).locator('.medical-card')).toHaveCount(0);
});

test('estadísticas: cuenta alertas y exporta CSV sin datos personales', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);

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
