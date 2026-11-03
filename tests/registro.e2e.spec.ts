// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { readStorage, view } from './helpers';

/** Bienvenida con el modo de demostración apagado → asistente de registro. */
async function startWithoutDemo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/bienvenida$/);
  await view(page).locator('ion-toggle').click();
  await view(page).getByRole('button', { name: 'Comenzar' }).click();
  await expect(page).toHaveURL(/\/registro$/);
}

test('registro obligatorio: los 4 pasos bloquean «Siguiente» hasta completarse', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 20 });
  await startWithoutDemo(page);
  const v = view(page);
  const next = v.getByRole('button', { name: 'Siguiente' });

  // 1. Nombre
  await expect(v.getByText('Paso 1 de 4')).toBeVisible();
  await expect(next).toBeDisabled();
  await v.locator('ion-input[label="Nombre de usuario"] input').fill('Ana');
  await expect(next).toBeEnabled();
  await next.click();

  // 2. Ubicación actual (real del dispositivo)
  await expect(v.getByText('Paso 2 de 4')).toBeVisible();
  await expect(next).toBeDisabled();
  await v.getByRole('button', { name: 'Obtener mi ubicación' }).click();
  await expect(v.getByText(/Ubicación obtenida\./)).toBeVisible({ timeout: 15_000 });
  await next.click();

  // 3. Punto de encuentro
  await expect(v.getByText('Paso 3 de 4')).toBeVisible();
  await expect(next).toBeDisabled();
  await v.getByRole('button', { name: 'Mi ubicación actual' }).click();
  await expect(v.getByText('Guardado: Punto de encuentro')).toBeVisible();
  await next.click();

  // 4. Contacto real
  await expect(v.getByText('Paso 4 de 4')).toBeVisible();
  const finish = v.getByRole('button', { name: 'Finalizar registro' });
  await expect(finish).toBeDisabled();
  await v.getByRole('button', { name: 'Agregar contacto' }).click();
  const modal = page.locator('ion-modal');
  await modal.locator('ion-input[label="Nombre"] input').fill('Luisa');
  await modal.locator('ion-input[label="Teléfono"] input').fill('320 349 8531');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('luisa@example.com');
  await modal.getByRole('radio', { name: 'Familiar' }).click();
  await page.waitForTimeout(300);
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await expect(v.getByText('1 contacto agregado.')).toBeVisible();
  await finish.click();

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Ana');
  const data = await readStorage(page);
  expect(data.settings).toMatchObject({ onboarded: true, userName: 'Ana', demoMode: false });
  expect(data.lastLocation).toMatchObject({ source: 'dispositivo', latitude: 4.65 });
  expect(data.meetingPoints).toEqual([expect.objectContaining({ latitude: 4.65, longitude: -74.1 })]);
  expect(data.contacts).toHaveLength(1);
});

test('registro: sin terminar no queda registrado y el SOS sigue disponible', async ({ page }) => {
  await startWithoutDemo(page);
  expect((await readStorage(page))?.settings?.onboarded ?? false).toBe(false);
  await view(page).getByRole('button', { name: 'SOS · Emergencia ahora' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.locator('ion-alert')).toBeVisible();
});

test('registro: el contacto se puede traer de la agenda (nombre y teléfono precargados)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'contacts', {
      value: { select: async () => [{ name: ['Luisa Agenda'], tel: ['320 349 8531'] }] },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sismo:v1:data', JSON.stringify({
    version: 1,
    settings: { userName: 'Ana' },
    lastLocation: { latitude: 4.6, longitude: -74, accuracy: 10, timestamp: new Date().toISOString(), source: 'dispositivo' },
    meetingPoints: [{ id: 'a', label: 'Parque', latitude: 4.6, longitude: -74 }],
  })));
  await page.goto('/registro');
  const v = view(page);
  for (let i = 0; i < 3; i++) await v.getByRole('button', { name: 'Siguiente' }).click();
  await v.getByRole('button', { name: 'De la agenda' }).click();
  const modal = page.locator('ion-modal');
  await expect(modal.locator('ion-input[label="Nombre"] input')).toHaveValue('Luisa Agenda');
  await expect(modal.locator('ion-input[label="Teléfono"] input')).toHaveValue('320 349 8531');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('luisa@example.com');
  await modal.getByRole('radio', { name: 'Familiar' }).click();
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await expect(v.getByText('1 contacto agregado.')).toBeVisible();
});

test('registro: el contacto agregado se puede editar o eliminar si hubo un error', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sismo:v1:data', JSON.stringify({
    version: 1,
    settings: { userName: 'Ana' },
    lastLocation: { latitude: 4.6, longitude: -74, accuracy: 10, timestamp: new Date().toISOString(), source: 'dispositivo' },
    meetingPoints: [{ id: 'a', label: 'Parque', latitude: 4.6, longitude: -74 }],
    contacts: [{ id: 'c1', name: 'Luisa', relationship: 'Familiar', phone: '320 000 0000', email: 'luisa@example.com', isSeed: false, createdAt: '' }],
  })));
  await page.goto('/registro');
  const v = view(page);
  for (let i = 0; i < 3; i++) await v.getByRole('button', { name: 'Siguiente' }).click();

  // Editar: corrige el teléfono.
  await v.getByRole('button', { name: 'Editar Luisa' }).click();
  const modal = page.locator('ion-modal');
  await modal.locator('ion-input[label="Teléfono"] input').fill('320 349 8531');
  await modal.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(v.getByText('320 349 8531 · luisa@example.com')).toBeVisible();
  expect((await readStorage(page)).contacts).toHaveLength(1);

  // Eliminar: pide confirmación y el paso vuelve a quedar incompleto.
  await v.getByRole('button', { name: 'Eliminar Luisa' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Eliminar' }).click();
  await expect(v.getByText('1 contacto agregado.')).toHaveCount(0);
  await expect(v.getByRole('button', { name: 'Finalizar registro' })).toBeDisabled();
});
