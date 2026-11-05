// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test, type Page } from '@playwright/test';
import { goTo, onboard, readStorage, view } from './helpers';

/** Agrega un contacto real desde Contactos; `principal` marca «Contacto principal del correo». */
async function addContact(page: Page, name: string, email: string, principal = false) {
  await view(page).getByRole('button', { name: 'Agregar', exact: true }).click();
  const modal = page.locator('ion-modal');
  await modal.locator('ion-input[label="Nombre"] input').fill(name);
  await modal.locator('ion-input[label="Teléfono"] input').fill('320 349 8531');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill(email);
  await modal.getByRole('radio', { name: 'Familiar' }).click();
  if (principal) await modal.locator('ion-toggle[aria-label="Contacto principal del correo"]').click();
  await page.waitForTimeout(300);
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
}

test('correo: el primer contacto es el principal y los demás van en copia oculta; se pueden marcar varios principales', async ({ page }) => {
  await onboard(page, false);
  await goTo(page, '/contactos', 'Contactos de confianza');
  const v = view(page);

  // Sin marcar ninguno, el primero queda como principal («Para»).
  await addContact(page, 'Luisa', 'luisa@example.com');
  await expect(v.locator('.contact-card', { hasText: 'Luisa' })).toContainText('Correo: principal');

  // El segundo, sin marcar, va en copia oculta.
  await addContact(page, 'Pedro', 'pedro@example.com');
  await expect(v.locator('.contact-card', { hasText: 'Pedro' })).toContainText('Correo: copia oculta');

  // Un tercero marcado como principal: hay dos principales.
  await addContact(page, 'Marta', 'marta@example.com', true);
  await expect(v.locator('.contact-card', { hasText: 'Marta' })).toContainText('Correo: principal');
  const contacts = (await readStorage(page)).contacts as { name: string; emailPrimary?: boolean }[];
  expect(contacts.filter((c) => c.emailPrimary).map((c) => c.name).sort()).toEqual(['Luisa', 'Marta']);
});
