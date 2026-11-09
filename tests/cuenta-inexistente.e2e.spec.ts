// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test, type Page } from '@playwright/test';

/**
 * Cuenta borrada en el servidor (p. ej. «Vaciar todos los usuarios» del panel): la app NO la vuelve a crear con lo
 * que tiene guardado; borra el teléfono y lleva al registro. Durante una alerta activa espera a que termine.
 */
const contact = { id: 'c1', name: 'Ana Restrepo', relationship: 'Hermana', phone: '3001234567', email: 'ana@example.com', isSeed: false, createdAt: '2026-11-01T10:00:00.000Z' };

function data(activeAlert: boolean) {
  const alert = { id: 'a1', eventType: 'sismo', status: 'activa', activatedAt: new Date().toISOString(), location: null, digitalStatus: 'no_disponible', simulatedDelivery: false, contactsCount: 1, isSeed: false };
  return {
    version: 1,
    settings: { userName: 'Ana Demo', onboarded: true, language: 'es', theme: 'claro', soundEnabled: false, visualSignalEnabled: false, vibrationEnabled: false, alarmSound: 'sirena', fallDetection: false, lowBatterySaver: 0, highContrast: false, largeText: false, reduceMotion: true, demoMode: false },
    contacts: [contact], alerts: activeAlert ? [alert] : [], activeAlertId: activeAlert ? 'a1' : null, lastLocation: null, locationPermission: 'concedido',
    medical: null, meetingPoints: [], susResponses: [], kit: null, postQuakeDone: [],
  };
}

async function start(page: Page, activeAlert: boolean) {
  const conTokenNuevo: string[] = [];
  await page.route(/api\.test\/sismo\/.*/, (route) => {
    const url = route.request().url();
    if (route.request().headers().authorization === `Bearer ${'b'.repeat(64)}`) {
      conTokenNuevo.push(url.replace('http://api.test/sismo/', ''));
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (url.endsWith('/registro')) {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ uuid_dispositivo: 'nuevo', token: 'b'.repeat(64) }) });
    }
    // Cualquier petición con el token viejo: la cuenta ya no existe.
    if (route.request().headers().authorization) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"no_autorizado"}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.addInitScript((d) => {
    if (sessionStorage.getItem('iniciado')) return;
    sessionStorage.setItem('iniciado', '1');
    localStorage.setItem('sismo:v1:api_pruebas', 'http://api.test/sismo');
    localStorage.setItem('sismo:v1:dispositivo', JSON.stringify({ uuid: 'viejo', token: 'a'.repeat(64) }));
    localStorage.setItem('sismo:v1:data', JSON.stringify(d));
    // Un cambio pendiente fuerza la primera petición con el token viejo.
    localStorage.setItem('sismo:v1:outbox', JSON.stringify([{ key: 'contactos:c1', method: 'PUT', path: 'contactos/c1', body: {} }]));
  }, data(activeAlert));
  return conTokenNuevo;
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('sismo:v1:data') ?? 'null'));

test('cuenta borrada en el servidor: borra el teléfono y lleva a Bienvenida sin volver a subir los datos viejos', async ({ page }) => {
  const conTokenNuevo = await start(page, false);
  await page.goto('/inicio');
  await expect(page).toHaveURL(/\/bienvenida$/, { timeout: 20_000 });
  await expect(page.getByText('Su cuenta ya no existe en el servidor.', { exact: false })).toBeVisible();
  const d = await stored(page);
  expect(d?.contacts ?? []).toEqual([]);
  expect(d?.settings?.onboarded ?? false).toBe(false);
  // Puede registrarse un dispositivo nuevo y vacío (como una instalación nueva, para que el SOS funcione durante
  // el registro), pero nunca se suben los contactos ni el historial viejos.
  await page.waitForTimeout(1500);
  expect(conTokenNuevo.filter((p) => p.startsWith('contactos') || p.startsWith('alertas'))).toEqual([]);
});

test('con una alerta activa no interrumpe: espera a que termine', async ({ page }) => {
  await start(page, true);
  await page.goto('/alerta');
  await page.waitForTimeout(4000);
  await expect(page).toHaveURL(/\/alerta$/);
  expect((await stored(page))?.contacts).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem('sismo:v1:cuenta_inexistente'))).toBe('true');
});
