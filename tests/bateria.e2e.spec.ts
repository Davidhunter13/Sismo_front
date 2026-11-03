// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test, type Page } from '@playwright/test';
import { activateAlert, goTo, onboard, view } from './helpers';

/** Batería simulada (Battery API del navegador) y un contacto real sin correo (no aparece la pregunta del correo). */
async function setup(page: Page, level: number, threshold?: number) {
  await page.addInitScript((lvl) => {
    Object.defineProperty(navigator, 'getBattery', { value: async () => ({ level: lvl, charging: false }), configurable: true });
  }, level);
  await onboard(page, false);
  await page.evaluate((th) => {
    const data = JSON.parse(localStorage.getItem('sismo:v1:data') ?? '{}');
    data.contacts = [{ id: 'c1', name: 'Luisa', relationship: 'Familiar', phone: '3203498531', isSeed: false, createdAt: '' }];
    if (th !== undefined) data.settings = { ...data.settings, lowBatterySaver: th };
    localStorage.setItem('sismo:v1:data', JSON.stringify(data));
  }, threshold);
  await page.goto('/inicio');
}

test('batería baja en la alerta: pasa sola al modo ahorro, avisa y respeta volver a la señal continua', async ({ page }) => {
  await setup(page, 0.15);
  await activateAlert(page);
  const v = view(page);
  await expect(v.getByText('Batería al 15 %: se activó el modo ahorro para que las señales duren más.')).toBeVisible();
  await expect(v.getByRole('button', { name: 'Salir del modo atrapado' })).toBeVisible();

  await v.getByRole('button', { name: 'Avisar a mis contactos' }).click();
  const sheet = page.locator('ion-action-sheet');
  await expect(sheet.getByText('¿Por dónde avisa que tiene poca batería?')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'WhatsApp: Luisa' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Ahora no' }).click();

  // Si la persona vuelve a la señal continua, no se reactiva solo en esta alerta.
  await v.getByRole('button', { name: 'Volver a la señal continua' }).click();
  await expect(v.getByRole('button', { name: 'Activar modo atrapado' })).toBeVisible();
  await goTo(page, '/inicio', 'Panel principal');
  await page.goto('/alerta');
  await page.waitForTimeout(1500);
  await expect(view(page).getByRole('button', { name: 'Activar modo atrapado' })).toBeVisible();
});

test('batería baja: con «Nunca» en Configuración no cambia de modo', async ({ page }) => {
  await setup(page, 0.15, 0);
  await activateAlert(page);
  await page.waitForTimeout(1500);
  await expect(view(page).getByText(/se activó el modo ahorro/)).toHaveCount(0);
  await expect(view(page).getByRole('button', { name: 'Activar modo atrapado' })).toBeVisible();
});

test('configuración: umbral de ahorro de batería, 20 % por defecto', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/configuracion', 'Configuración');
  const seg = view(page).locator('ion-segment[aria-label="Pasar solo al modo ahorro con batería al"]');
  await expect(seg).toHaveAttribute('value', '20');
  await seg.locator('ion-segment-button[value="30"]').click();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('sismo:v1:data') ?? '{}').settings?.lowBatterySaver)).toBe(30);
});
