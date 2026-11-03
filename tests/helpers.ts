// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, type Page } from '@playwright/test';

/** Página Ionic visible (IonRouterOutlet conserva las anteriores ocultas en el DOM). */
export const view = (page: Page) => page.locator('.ion-page:not(.ion-page-hidden)').last();

export async function goTo(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path);
  await expect(view(page).locator('.app-header__subtitle')).toHaveText(heading);
}

/**
 * Con demo: Bienvenida → Comenzar. Sin demo: app ya registrada pero sin datos (como si el usuario hubiera
 * borrado contactos y puntos después del registro), para probar los estados vacíos sin pasar por el asistente
 * obligatorio, que tiene sus propias pruebas.
 */
export async function onboard(page: Page, demo = true) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/bienvenida$/);
  if (demo) {
    await view(page).getByRole('button', { name: 'Comenzar' }).click();
  } else {
    await page.evaluate(() => localStorage.setItem('sismo:v1:data', JSON.stringify({ version: 1, settings: { onboarded: true } })));
    await page.goto('/inicio');
  }
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Hola');
}

export async function navTo(page: Page, label: string, url: RegExp) {
  await view(page).locator('.bottom-nav').getByRole('button', { name: label, exact: true }).click();
  await expect(page).toHaveURL(url);
  await page.waitForTimeout(450); // transición de Ionic
}

export async function activateAlert(page: Page, type = 'Sismo') {
  await view(page).getByRole('button', { name: 'Activar alerta de emergencia' }).click();
  const dialog = page.locator('ion-alert');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: type }).click();
  await dialog.getByRole('button', { name: 'Activar alerta' }).click();
  await expect(page).toHaveURL(/\/alerta$/);
}

export async function readStorage(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('sismo:v1:data') ?? 'null'));
}
