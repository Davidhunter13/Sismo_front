// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { activateAlert, goTo, navTo, onboard, readStorage, view } from './helpers';

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
});

test.afterEach(() => {
  expect(consoleErrors, 'errores de consola').toEqual([]);
});

test('todas las rutas cargan', async ({ page }) => {
  await onboard(page);
  const routes: [string, string][] = [
    ['/inicio', 'Panel principal'],
    ['/ubicacion', 'Ubicación'],
    ['/contactos', 'Contactos de confianza'],
    ['/historial', 'Historial de alertas'],
    ['/guia', 'Guía de emergencia'],
    ['/configuracion', 'Configuración'],
    ['/alerta', 'Alerta'],
    ['/historial/demo-a1', 'Detalle de alerta'],
  ];
  for (const [path, title] of routes) await goTo(page, path, title);
  await page.goto('/bienvenida');
  await expect(view(page).getByRole('heading', { name: 'SISMO' })).toBeVisible();
});

test('navegación inferior y regreso al inicio', async ({ page }) => {
  await onboard(page);
  await navTo(page, 'Ubicación', /\/ubicacion$/);
  await navTo(page, 'Contactos', /\/contactos$/);
  await navTo(page, 'Historial', /\/historial$/);
  await navTo(page, 'Guía', /\/guia$/);
  await view(page).getByRole('button', { name: 'Configuración' }).click();
  await expect(page).toHaveURL(/\/configuracion$/);
  await page.waitForTimeout(450);
  await view(page).getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page).toHaveURL(/\/guia$/);
  await page.waitForTimeout(450);
  await view(page).getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
});

test('activar y finalizar alerta actualiza el historial (modo demo)', async ({ page }) => {
  await onboard(page);
  await activateAlert(page, 'Prueba del sistema');
  const v = view(page);
  await expect(v.getByRole('heading', { name: 'ALERTA ACTIVA' })).toBeVisible();
  await expect(v.locator('.badge', { hasText: 'Activada localmente' })).toBeVisible();
  await expect(v.locator('.badge', { hasText: 'Pendiente' })).toBeVisible();
  // Entrega SIMULADA (3 contactos ficticios) → "Enviada" + rótulo de simulación.
  await expect(v.locator('.badge', { hasText: 'Enviada' })).toBeVisible({ timeout: 6000 });
  await expect(v.locator('.badge', { hasText: 'Simulación' })).toBeVisible();

  await v.getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  // Al finalizar se abre la lista «Después del sismo»; luego se vuelve a Inicio.
  await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);
  await page.waitForTimeout(450);
  await navTo(page, 'Inicio', /\/inicio$/);
  await expect(view(page).getByText('Sin alertas activas')).toBeVisible();

  const data = await readStorage(page);
  expect(data.activeAlertId).toBeNull();
  expect(data.alerts[0]).toMatchObject({ eventType: 'prueba', status: 'finalizada', digitalStatus: 'enviada', simulatedDelivery: true });

  await navTo(page, 'Historial', /\/historial$/);
  await expect(view(page).locator('.history-item').first()).toContainText('Prueba del sistema');
  await expect(view(page).locator('.stat').first()).toContainText('5');
});

test('sin modo demo el canal digital no se simula', async ({ page }) => {
  await onboard(page, false);
  await activateAlert(page);
  await expect(view(page).locator('.badge', { hasText: 'Sin canal digital' })).toBeVisible();
  await expect(view(page).getByText('Nadie ha sido notificado')).toBeVisible();
  const data = await readStorage(page);
  expect(data.alerts[0]).toMatchObject({ digitalStatus: 'no_disponible', simulatedDelivery: false });
});

test('cancelar la confirmación no activa la alerta', async ({ page }) => {
  await onboard(page);
  await view(page).getByRole('button', { name: 'Activar alerta de emergencia' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  expect((await readStorage(page)).activeAlertId).toBeNull();
});

test('contactos: validación, alta, edición, borrado y persistencia', async ({ page }) => {
  await onboard(page);
  await navTo(page, 'Contactos', /\/contactos$/);
  await expect(view(page).locator('.contact-card')).toHaveCount(3);

  await view(page).getByRole('button', { name: 'Agregar', exact: true }).click();
  const modal = page.locator('ion-modal');
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await expect(modal.getByText('Revise los campos marcados.')).toBeVisible();
  await expect(modal.getByText('Ingrese al menos 2 caracteres.')).toBeVisible();
  await expect(modal.getByText('El teléfono es obligatorio.')).toBeVisible();
  await expect(modal.getByText('El correo es obligatorio.')).toBeVisible();

  await modal.locator('ion-input[label="Nombre"] input').fill('Pedro (demo)');
  await modal.locator('ion-input[label="Teléfono"] input').fill('12ab');
  await expect(modal.getByText('Entre 7 y 15 dígitos; puede iniciar con +.')).toBeVisible();
  await modal.locator('ion-input[label="Teléfono"] input').fill('300 000 0009');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('pedro@');
  await expect(modal.getByText('Ingrese un correo válido (ej.: nombre@correo.com).')).toBeVisible();
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('pedro.demo@example.com');
  await modal.locator('ion-select').click();
  await page.locator('ion-popover').getByText('Amigo/a', { exact: true }).click();
  await page.waitForTimeout(300);
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await expect(page.locator('ion-toast')).toContainText('Contacto agregado');
  await expect(view(page).locator('.contact-card')).toHaveCount(4);
  await expect(view(page).locator('.contact-card', { hasText: 'Pedro (demo)' })).toContainText('pedro.demo@example.com');

  await view(page).getByRole('button', { name: 'Editar Pedro (demo)' }).click();
  await modal.locator('ion-input[label="Nombre"] input').fill('Pedro Editado (demo)');
  await modal.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(view(page).getByText('Pedro Editado (demo)')).toBeVisible();

  await page.reload();
  await expect(view(page).getByText('Pedro Editado (demo)')).toBeVisible();

  await view(page).getByRole('button', { name: 'Eliminar Pedro Editado (demo)' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Eliminar' }).click();
  await expect(view(page).locator('.contact-card')).toHaveCount(3);
  expect((await readStorage(page)).contacts).toHaveLength(3);
});

test('ubicación: denegada sin permiso y coordenadas de prueba rotuladas', async ({ page }) => {
  await onboard(page);
  await navTo(page, 'Ubicación', /\/ubicacion$/);
  await view(page).getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect(view(page).locator('.badge', { hasText: /Permiso denegado|No disponible/ })).toBeVisible({ timeout: 15000 });
  await view(page).getByRole('button', { name: 'Usar coordenadas de prueba' }).click();
  await expect(view(page).getByText('No corresponden a su posición actual.')).toBeVisible();
  expect((await readStorage(page)).lastLocation.source).toBe('prueba');
});

test('ubicación: permiso concedido usa datos del dispositivo', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 25 });
  await onboard(page);
  await navTo(page, 'Ubicación', /\/ubicacion$/);
  await view(page).getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect(view(page).getByText('Ubicación del dispositivo')).toBeVisible();
  await expect(view(page).locator('.badge', { hasText: 'Permiso concedido' })).toBeVisible();
  expect((await readStorage(page)).lastLocation).toMatchObject({ source: 'dispositivo', latitude: 4.65 });
});

test('configuración: nombre, accesibilidad y restablecer persisten', async ({ page }) => {
  await onboard(page);
  await page.goto('/configuracion');
  const v = view(page);
  await v.locator('ion-input[label="Nombre de usuario"] input').fill('A');
  await expect(v.getByText('Mínimo 2 caracteres.')).toBeVisible();
  await v.locator('ion-input[label="Nombre de usuario"] input').fill('Equipo SISMO');
  await v.getByRole('button', { name: 'Guardar nombre' }).click();
  await v.locator('ion-toggle[aria-label="Alto contraste"]').click();
  await expect(v.locator('ion-toggle[aria-label="Alto contraste"]')).toHaveJSProperty('checked', true);
  await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast');

  await page.goto('/inicio');
  await expect(view(page).getByRole('heading', { name: 'Hola, Equipo SISMO' })).toBeVisible();

  await page.goto('/configuracion');
  await view(page).getByRole('button', { name: 'Restablecer datos de demostración' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Restablecer' }).click();
  const data = await readStorage(page);
  expect(data.contacts).toHaveLength(3);
  expect(data.alerts).toHaveLength(4);

  await view(page).getByRole('button', { name: 'Borrar todos los datos' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Borrar todo' }).click();
  await expect(page).toHaveURL(/\/bienvenida$/);
});
