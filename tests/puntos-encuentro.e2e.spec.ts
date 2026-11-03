// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test } from '@playwright/test';
import { goTo, onboard, readStorage, view } from './helpers';

const here = { latitude: 4.7, longitude: -74.05, accuracy: 15, timestamp: '2026-11-01T10:00:00Z', source: 'dispositivo' };
const casa = { id: 'a', label: 'Casa', latitude: 4.6, longitude: -74.08 };
const trabajo = { id: 'b', label: 'Trabajo', latitude: 4.701, longitude: -74.051 };

test('varios puntos de encuentro: lista, el más cercano guía la brújula y se puede elegir otro', async ({ page }) => {
  await onboard(page, false);
  await page.evaluate(
    ([loc, points]) => {
      const data = JSON.parse(localStorage.getItem('sismo:v1:data') ?? '{}');
      localStorage.setItem('sismo:v1:data', JSON.stringify({ ...data, lastLocation: loc, meetingPoints: points }));
    },
    [here, [casa, trabajo]] as const,
  );
  await goTo(page, '/ubicacion', 'Ubicación');
  const v = view(page);

  await expect(v.getByText('Puntos guardados (2 de 5)')).toBeVisible();
  const chooser = v.locator('#brujula .meeting-chooser');
  await expect(chooser.getByRole('button', { name: /Trabajo.*más cercano/ })).toHaveAttribute('aria-pressed', 'true');
  await chooser.getByRole('button', { name: /Casa/ }).click();
  await expect(chooser.getByRole('button', { name: /Casa/ })).toHaveAttribute('aria-pressed', 'true');

  await v.getByRole('button', { name: 'Borrar el punto «Casa»' }).click();
  await expect(v.getByText('Puntos guardados (1 de 5)')).toBeVisible();
  await expect(chooser).toHaveCount(0);
  expect((await readStorage(page)).meetingPoints).toEqual([trabajo]);
});

test('se agregan puntos uno tras otro hasta el máximo de 5', async ({ page }) => {
  await onboard(page, false);
  await page.evaluate((loc) => {
    const data = JSON.parse(localStorage.getItem('sismo:v1:data') ?? '{}');
    localStorage.setItem('sismo:v1:data', JSON.stringify({ ...data, lastLocation: loc }));
  }, here);
  await goTo(page, '/ubicacion', 'Ubicación');
  const v = view(page);
  const add = v.getByRole('button', { name: 'Mi ubicación actual' });
  for (let i = 1; i <= 5; i++) {
    await add.click();
    await expect(v.getByText(`Puntos guardados (${i} de 5)`)).toBeVisible();
  }
  await expect(v.getByText('Llegó al máximo de 5 puntos. Borre uno para agregar otro.')).toBeVisible();
  await expect(add).toBeDisabled();
});

test('la ubicación se actualiza sola cada 5 minutos con la app abierta', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 4.65, longitude: -74.1, accuracy: 15 });
  await page.clock.install();
  await onboard(page, false);
  await goTo(page, '/ubicacion', 'Ubicación');
  await view(page).getByRole('button', { name: 'Solicitar mi ubicación' }).click();
  await expect.poll(async () => (await readStorage(page)).lastLocation?.latitude, { timeout: 15_000 }).toBe(4.65);

  // La persona se mueve: antes de 5 minutos no cambia; al cumplirse, sí.
  await context.setGeolocation({ latitude: 4.7, longitude: -74.05, accuracy: 15 });
  await page.clock.runFor('04:00');
  expect((await readStorage(page)).lastLocation.latitude).toBe(4.65);
  await page.clock.runFor('01:05');
  await expect.poll(async () => (await readStorage(page)).lastLocation?.latitude, { timeout: 15_000 }).toBe(4.7);
});
