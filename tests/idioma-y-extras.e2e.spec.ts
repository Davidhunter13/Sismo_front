// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { activateAlert, goTo, onboard, readStorage, view } from './helpers';

// Las pestañas de Ionic se pulsan sobre ion-segment-button (el botón interno no recibe el clic).
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
});

test.afterEach(() => {
  expect(consoleErrors, 'errores de consola').toEqual([]);
});

test('idioma: se elige en la bienvenida y la app queda en inglés', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/bienvenida$/);
  await view(page).locator('ion-segment-button[value="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await view(page).locator('.welcome__inner button.btn--primary').click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(view(page).locator('.app-header__subtitle')).toHaveText('Dashboard');
  await expect(view(page).locator('.bottom-nav').getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  expect((await readStorage(page)).settings.language).toBe('en');
});

test('idioma: se cambia en Configuración y vuelve al español', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  await view(page).locator('ion-segment-button[value="en"]').click();
  await expect(view(page).locator('.app-header__subtitle')).toHaveText('Settings');
  await view(page).locator('ion-segment-button[value="es"]').click();
  await expect(view(page).locator('.app-header__subtitle')).toHaveText('Configuración');
});

test('idioma: el diálogo de SOS y la alerta salen en inglés', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  await view(page).locator('ion-segment-button[value="en"]').click();
  await expect.poll(async () => (await readStorage(page)).settings.language).toBe('en');
  await goTo(page, '/inicio', 'Dashboard');
  await view(page).locator('.panic__button').click();
  const dialog = page.locator('ion-alert');
  await expect(dialog.getByRole('heading', { name: 'Activate alert?' })).toBeVisible();
  await dialog.getByRole('radio', { name: 'Earthquake' }).click();
  await dialog.getByRole('button', { name: 'Activate alert' }).click();
  await expect(page).toHaveURL(/\/alerta$/);
  await expect(view(page).locator('.alert-hero p').first()).toHaveText('Earthquake');
});

test('tema oscuro: se aplica y se puede volver al del sistema', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  await view(page).locator('ion-segment-button[value="oscuro"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await view(page).locator('ion-segment-button[value="claro"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await view(page).locator('ion-segment-button[value="sistema"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('después del sismo: marcar pasos guarda el avance', async ({ page }) => {
  await onboard(page, false);
  await view(page).locator('.quick-tile', { hasText: 'Después del sismo' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo$/);
  const v = view(page);
  await expect(v.locator('.kit-item')).toHaveCount(11);
  await v.locator('.kit-item ion-checkbox').nth(0).click();
  await v.locator('.kit-item ion-checkbox').nth(2).click();
  await expect(v.getByText('2 de 11 pasos')).toBeVisible();
  // El avance se guarda por clave de paso del catálogo (antes por posición).
  await expect.poll(async () => (await readStorage(page)).postQuakeDone).toEqual(['paso_01', 'paso_03']);
  await v.getByRole('button', { name: 'Reiniciar lista' }).click();
  await expect(v.getByText('0 de 11 pasos')).toBeVisible();
});

test('después del sismo: cada SOS empieza con la lista vacía y la anterior se conserva', async ({ page }) => {
  await onboard(page, false);
  const finish = async () => {
    await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
    await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
    await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);
    await page.waitForTimeout(450);
  };
  await activateAlert(page);
  await finish();
  await view(page).locator('.kit-item ion-checkbox').nth(0).click();
  await expect(view(page).getByText('1 de 11 pasos')).toBeVisible();

  await view(page).locator('.bottom-nav').getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await page.waitForTimeout(450);
  await activateAlert(page);
  await finish();
  await expect(view(page).getByText('0 de 11 pasos')).toBeVisible();

  const alerts = (await readStorage(page)).alerts;
  expect(alerts[0].postQuakeDone ?? []).toEqual([]);
  expect(alerts[1].postQuakeDone).toEqual(['paso_01']);
});

test('después de «Estoy a salvo»: sin punto de encuentro invita a configurarlo; con uno muestra la brújula', async ({ page, context }) => {
  await onboard(page, false);
  await activateAlert(page);
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);
  await expect(view(page).getByText(/No tiene un punto de encuentro configurado/)).toBeVisible();
  await view(page).getByRole('button', { name: 'Configurar punto de encuentro' }).click();
  await expect(page).toHaveURL(/\/ubicacion\?ver=brujula$/);

  // Con punto de encuentro guardado, la lista muestra su nombre y la brújula.
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 10 });
  await page.waitForTimeout(450);
  await view(page).getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect.poll(async () => (await readStorage(page)).lastLocation?.latitude, { timeout: 15_000 }).toBe(4.65);
  await view(page).getByRole('button', { name: 'Mi ubicación actual' }).click();
  await goTo(page, '/despues-del-sismo', 'Después del sismo');
  await expect(view(page).getByText(/Su punto de encuentro es «Punto de encuentro»/)).toBeVisible();
  await expect(view(page).locator('.compass')).toBeVisible();
});

test('punto de encuentro por dirección: busca, elige y lo guarda', async ({ page }) => {
  // Buscadores simulados (Esri sin resultados, Photon con uno): las pruebas no dependen de internet.
  await page.route('https://geocode.arcgis.com/**', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ candidates: [] }) }),
  );
  await page.route('https://photon.komoot.io/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        features: [{ properties: { name: 'Parque Simón Bolívar', city: 'Bogotá', country: 'Colombia', countrycode: 'CO' }, geometry: { coordinates: [-74.093, 4.658] } }],
      }),
    }),
  );
  await onboard(page, false);
  await goTo(page, '/ubicacion', 'Ubicación');
  const v = view(page);
  await v.locator('ion-input', { hasText: 'O busque una dirección' }).locator('input').fill('Parque Simón Bolívar');
  await v.getByRole('button', { name: 'Buscar', exact: true }).click();
  await v.getByRole('button', { name: /Parque Simón Bolívar, Bogotá, Colombia/ }).click();
  await expect.poll(async () => (await readStorage(page)).meetingPoints).toEqual([
    expect.objectContaining({ label: 'Parque Simón Bolívar', latitude: 4.658, longitude: -74.093 }),
  ]);
  await expect(v.locator('#brujula')).not.toContainText('Para usar la brújula');
});

test('sin internet: aviso en la alerta y en inicio', async ({ page, context }) => {
  await onboard(page, false);
  // Se carga la vista de alerta antes de cortar la red (en el navegador sus archivos se descargan al abrirla;
  // en la app Android ya están en el teléfono).
  await activateAlert(page);
  await context.setOffline(true);
  await expect(view(page).getByText(/Sin internet: use SMS/)).toBeVisible();
  await view(page).getByRole('button', { name: /Volver/ }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(view(page).getByText(/Sin internet: use SMS/)).toBeVisible();
  await expect(view(page).locator('.service-row', { hasText: 'Conexión a internet' })).toContainText('Sin internet');
  await context.setOffline(false);
  await expect(view(page).getByText(/Sin internet: use SMS/)).toHaveCount(0);
});

test('QR médico: se genera en la ficha y aparece en la alerta', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/ficha-medica', 'Ficha médica');
  const v = view(page);
  await v.locator('ion-input').filter({ hasText: 'Alergias' }).locator('input').fill('Penicilina');
  await v.getByRole('button', { name: 'Guardar ficha' }).click();
  await v.getByRole('button', { name: 'Ver QR médico' }).click();
  await expect(v.getByRole('img', { name: 'Código QR con la ficha médica' })).toHaveAttribute('src', /^data:image\/png;base64,/);
  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  await expect(view(page).getByRole('img', { name: 'Código QR con la ficha médica' })).toBeVisible();
});

test('brújula: con punto de encuentro muestra distancia y dirección', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 10 });
  await onboard(page, false);
  await goTo(page, '/ubicacion', 'Ubicación');
  const v = view(page);
  await v.getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect.poll(async () => (await readStorage(page)).lastLocation?.latitude, { timeout: 15_000 }).toBe(4.65);
  await v.getByRole('button', { name: 'Mi ubicación actual' }).click();
  // En el mismo punto: «ya llegó».
  await expect(v.getByText('Está en el punto de encuentro o muy cerca.')).toBeVisible();
  // Se aleja ~1,1 km al sur: la flecha indica el norte.
  await context.setGeolocation({ latitude: 4.64, longitude: -74.1, accuracy: 10 });
  await expect(v.locator('.compass__distance')).toHaveText(/A 1\.1 km/, { timeout: 15_000 });
  await expect(v.getByText(/Dirección: 0° N/)).toBeVisible();
});

async function addRealContact(page: import('@playwright/test').Page) {
  await goTo(page, '/contactos', 'Contactos de confianza');
  await view(page).getByRole('button', { name: 'Agregar', exact: true }).click();
  const modal = page.locator('ion-modal');
  await modal.locator('ion-input[label="Nombre"] input').fill('Luisa');
  await modal.locator('ion-input[label="Teléfono"] input').fill('320 349 8531');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('luisa@example.com');
  await modal.getByRole('radio', { name: 'Familiar' }).click();
  await page.waitForTimeout(300);
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await expect(view(page).locator('.contact-card')).toHaveCount(1);
}

test('correo: al activar pregunta y «No enviar» lo cancela', async ({ page }) => {
  await onboard(page, false);
  await addRealContact(page);
  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  const dialog = page.getByRole('alertdialog', { name: '¿Enviar correo a sus contactos?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Se enviará automáticamente en \d+\ss/);
  await dialog.getByRole('button', { name: 'No enviar' }).click();
  await expect(view(page).getByText('Usted eligió no enviar el correo.')).toBeVisible();
  await expect.poll(async () => (await readStorage(page)).alerts[0].emailStatus).toBe('cancelado');
  // El botón WhatsApp usa el número normalizado (57 + celular).
  await expect(view(page).getByRole('button', { name: 'WhatsApp: Luisa' })).toBeVisible();
});

test('«Avisar que estoy bien»: elige SMS o WhatsApp por contacto', async ({ page }) => {
  await onboard(page, false);
  await addRealContact(page);
  await goTo(page, '/inicio', 'Panel principal');
  await view(page).getByRole('button', { name: 'Avisar que estoy bien' }).click();
  const sheet = page.locator('ion-action-sheet');
  await expect(sheet.getByText('¿Por dónde avisa que está bien?')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Por SMS (1 contacto(s))' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'WhatsApp: Luisa' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Ahora no' }).click();
  await expect(sheet).toBeHidden();
});

test('correo: sin respuesta en 20 s se envía; sin servidor configurado lo indica', async ({ page }) => {
  test.setTimeout(90_000);
  await onboard(page, false);
  await addRealContact(page);
  await goTo(page, '/inicio', 'Panel principal');
  await activateAlert(page);
  await expect(page.getByRole('alertdialog', { name: '¿Enviar correo a sus contactos?' })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 25_000 });
  await expect(view(page).getByText('No se envió: falta conectar el servidor de correo.')).toBeVisible();
  expect((await readStorage(page)).alerts[0].emailStatus).toBe('sin_servidor');
});

test('correo: sin contactos reales con correo no pregunta', async ({ page }) => {
  await onboard(page); // modo demo: contactos ficticios
  await activateAlert(page);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect.poll(async () => (await readStorage(page)).alerts[0].emailStatus).toBe('sin_destinatarios');
});

test('tema: el botón del encabezado alterna claro y oscuro', async ({ page }) => {
  await onboard(page, false);
  await view(page).getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await view(page).getByRole('button', { name: 'Cambiar a tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('ruta al punto de encuentro: distancia, tiempo por modo y enlace a Google Maps', async ({ page, context }) => {
  // Servicio de rutas simulado: la prueba no depende de internet.
  await page.route('https://routing.openstreetmap.de/**', (route) => {
    const car = route.request().url().includes('/routed-car/');
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'Ok',
        routes: [{ distance: car ? 849 : 519, duration: car ? 180 : 420, geometry: { coordinates: [[-74.1, 4.65], [-74.09, 4.66]] } }],
      }),
    });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 10 });
  await onboard(page, false);
  await goTo(page, '/ubicacion', 'Ubicación');
  const v = view(page);
  // Sin punto de encuentro: aviso y borde amarillo.
  await expect(v.locator('#brujula.meeting-missing')).toContainText('No tiene un punto de encuentro configurado');
  await v.getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect.poll(async () => (await readStorage(page)).lastLocation?.latitude, { timeout: 15_000 }).toBe(4.65);
  await v.getByRole('button', { name: 'Mi ubicación actual' }).click();
  await expect(v.locator('#brujula')).not.toHaveClass(/meeting-missing/);

  const ruta = v.locator('#ruta');
  await expect(ruta.locator('.route-summary')).toContainText('519 m · 7 min aprox.');
  await ruta.locator('ion-segment-button[value="car"]').click();
  await expect(ruta.locator('.route-summary')).toContainText('849 m · 3 min aprox.');
  await expect(ruta.getByRole('link', { name: /Abrir ruta en Google Maps/ })).toHaveAttribute('href', /travelmode=driving/);
  await expect(ruta.getByRole('link', { name: /Abrir en Waze/ })).toHaveAttribute('href', 'https://www.waze.com/live-map/directions?from=ll.4.65%2C-74.1&to=ll.4.65%2C-74.1');
});

test('mini brújula en inicio: invita a configurar y abre la brújula completa', async ({ page }) => {
  await onboard(page, false);
  const mini = view(page).locator('.mini-compass');
  await expect(mini).toContainText('Configure un punto de encuentro');
  await mini.click();
  await expect(page).toHaveURL(/\/ubicacion\?ver=brujula$/);
});

test('brújula: visible en Ubicación aun sin punto de encuentro, con la indicación', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/ubicacion', 'Ubicación');
  await expect(view(page).locator('#brujula')).toContainText('Para usar la brújula, guarde arriba un punto de encuentro');
});

test('recordatorio de simulacro en inicio lleva al simulacro', async ({ page }) => {
  await onboard(page, false);
  const reminder = view(page).locator('.drill-reminder');
  await expect(reminder).toContainText(/Aún no ha hecho un simulacro|Simulacro Nacional/);
  await reminder.getByRole('button', { name: 'Hacer simulacro' }).click();
  await expect(page).toHaveURL(/\/simulacro$/);
});
