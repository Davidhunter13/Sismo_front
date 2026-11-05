// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { expect, test, type Page, type Route } from '@playwright/test';
import { activateAlert, view } from './helpers';

/**
 * Insignias y foto de perfil con el API de SISMO simulado (page.route). La compilación de pruebas no tiene
 * VITE_SISMO_API_URL: la URL se fija con la clave de pruebas `sismo:v1:api_pruebas` (solo existe con VITE_DEMO).
 * Mismo origen que la app para no depender de CORS. Datos ficticios.
 */
const API = 'http://localhost:4173/api/sismo';
const IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#b08400"/></svg>');
const PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#1c8fb0"/></svg>');
/** PNG de 1×1 px generado (sin datos personales). */
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const earned = { id: 1, nivel: 'oro', familia: 'preparacion', secreta: false, nombre: 'Primeros pasos', descripcion: 'Terminó el registro', imagen: IMG, regla: 'Terminar el registro', obtenida: '2026-11-01T10:00:00Z', vence: null };
const fresh = { ...earned, id: 7, nivel: 'diamante', nombre: 'Con cara', descripcion: 'Puso su foto de perfil' };

function badgesReply(nuevas: unknown[] = [], extra: unknown[] = []) {
  return {
    ganadas: [earned, ...extra],
    por_ganar: [
      { id: 2, nivel: 'plata', familia: 'simulacros', secreta: false, nombre: 'Practicante', descripcion: 'Haga simulacros', imagen: IMG, regla: 'Hacer 5 simulacros', avance: 2, requerido: 5, hasta: '2026-12-31', dura_dias: 30 },
      { id: 3, nivel: 'bronce', familia: 'uso', secreta: false, nombre: 'Curioso', descripcion: 'Abra la app', imagen: IMG, regla: 'Abrir la app 10 días', avance: 1, requerido: 10, hasta: null, dura_dias: null },
    ],
    secretas: [{ id: 4, nivel: 'especial', familia: 'secretas', secreta: true, pista: 'Madrugue para practicar' }],
    vencidas: [{ id: 5, nivel: 'bronce', nombre: 'Mochila al día', imagen: IMG, vencio: '2026-10-01T00:00:00Z' }],
    nuevas,
    perfil: { porcentaje: 14, items: { nombre: true, foto: false, contactos: false, correo: false, puntos: false, ficha: false, mochila: false } },
    total: 100,
  };
}

interface Mock {
  /** Insignias nuevas para la PRÓXIMA respuesta (el servidor las entrega una sola vez). */
  pendingNew: unknown[];
  /** Ganadas después del inicio (las «nuevas» ya entregadas siguen apareciendo en «ganadas»). */
  extra: unknown[];
  actions: { accion: string; clave?: string; elemento?: string; valor?: number }[];
  photo: { url: string; expira: string } | null;
  uploads: string[];
  deletes: number;
}

async function mockApi(page: Page): Promise<Mock> {
  const m: Mock = { pendingNew: [], extra: [], actions: [], photo: null, uploads: [], deletes: 0 };
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/api/sismo/', '');
    const method = req.method();
    if (path === 'registro') return json(route, { uuid_dispositivo: 'u-e2e', token: 'e'.repeat(64) });
    if (path === 'insignias') {
      if (method === 'POST') m.actions.push(...(req.postDataJSON().acciones ?? []));
      const nuevas = m.pendingNew;
      m.pendingNew = [];
      m.extra.push(...nuevas);
      return json(route, badgesReply(nuevas, m.extra));
    }
    if (path === 'foto') {
      if (method === 'POST') {
        m.uploads.push(req.postDataJSON().imagen);
        m.photo = { url: PHOTO, expira: new Date(Date.now() + 15 * 60_000).toISOString() };
      } else if (method === 'DELETE') {
        m.deletes++;
        m.photo = null;
      }
      return json(route, { foto: m.photo });
    }
    if (path === 'atencion') return json(route, { atencion: null });
    return json(route, { ok: true });
  });
  return m;
}

/**
 * Antes de la primera carga: URL del API simulado y app ya registrada a nombre de «Ana Demo» (solo si aún no hay
 * datos, para no pisar lo que la app guarde después). Sin cargas intermedias: una navegación a mitad de una
 * respuesta perdería las «nuevas», que el servidor entrega una sola vez.
 */
async function init(page: Page) {
  await page.addInitScript((api) => {
    localStorage.setItem('sismo:v1:api_pruebas', api);
    if (!localStorage.getItem('sismo:v1:data')) {
      localStorage.setItem('sismo:v1:data', JSON.stringify({ version: 1, settings: { onboarded: true, userName: 'Ana Demo' } }));
    }
  }, API);
}

/** App registrada (sin pasar por el asistente) a nombre de «Ana Demo», con el API simulado. */
async function start(page: Page) {
  const m = await mockApi(page);
  await init(page);
  await page.goto('/inicio');
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Hola, Ana Demo');
  return m;
}

/** La tarjeta del aviso queda centrada en la pantalla (±24 px), con fondo oscurecido detrás. */
async function expectCentered(page: Page) {
  await expect(page.locator('.badge-notice-backdrop')).toBeVisible();
  const box = await notice(page).boundingBox();
  const vp = page.viewportSize();
  expect(box && vp).toBeTruthy();
  if (!box || !vp) return;
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(24);
  expect(Math.abs(box.y + box.height / 2 - vp.height / 2)).toBeLessThanOrEqual(24);
}

const notice = (page: Page) => page.getByRole('dialog', { name: '¡Ganaste una insignia!' });

test('Inicio: tarjetas «Perfil completado» y «Mis insignias»; página de insignias con sus pestañas', async ({ page }) => {
  const m = await start(page);
  const v = view(page);

  // Perfil calculado en el teléfono: solo el nombre (1 de 7 = 14 %) y enlaces a lo que falta.
  const profile = v.locator('.profile-card');
  await expect(profile).toContainText('Perfil completado');
  await expect(profile).toContainText('14 %');
  await expect(profile.getByRole('button', { name: 'Un contacto con correo' })).toBeVisible();
  await expect(profile.getByRole('button', { name: 'La ficha médica' })).toBeVisible();
  // Avatar con iniciales en el saludo (sin foto).
  await expect(v.locator('.greeting .avatar__initials')).toHaveText('AD');

  // Mis insignias: la última ganada y la más cercana (2 de 5 > 1 de 10).
  const card = v.locator('.my-badges-card');
  await expect(card).toContainText('Primeros pasos');
  await expect(card).toContainText('Practicante');
  await expect(card).toContainText('1 de 100 ganadas');

  // El enlace de «La ficha médica» lleva a su pantalla.
  await profile.getByRole('button', { name: 'La ficha médica' }).click();
  await expect(page).toHaveURL(/\/ficha-medica$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/inicio$/);

  await view(page).locator('.my-badges-card').getByRole('button', { name: 'Ver mis insignias' }).click();
  await expect(page).toHaveURL(/\/insignias$/);
  const b = view(page);
  await expect(b.locator('.badges-header__total')).toContainText('1/100');
  await expect(b.locator('.badge-list')).toContainText('Primeros pasos');
  await expect(b.locator('.badge-list .level-tag').first()).toHaveText('Oro');

  await b.locator('ion-segment-button', { hasText: 'Por ganar' }).click();
  const pending = b.locator('.badge-item', { hasText: 'Practicante' });
  await expect(pending).toContainText('Hacer 5 simulacros');
  await expect(pending).toContainText('2 de 5');
  await expect(pending).toContainText('Hasta el');
  await expect(pending).toContainText('Dura 30 días');
  await expect(pending.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');

  await b.locator('ion-segment-button', { hasText: 'Secretas' }).click();
  const secret = b.locator('.badge-list[aria-label="Secretas"] .badge-item');
  await expect(secret).toContainText('Madrugue para practicar');
  await expect(secret).toContainText('Insignia secreta');

  await b.locator('ion-segment-button', { hasText: 'Vencidas' }).click();
  const expired = b.locator('.badge-list[aria-label="Vencidas"] .badge-item');
  await expect(expired).toContainText('Mochila al día');
  await expect(expired).toContainText('Puede volver a ganarla');

  // Se registró el ingreso del día y la apertura de «Mis insignias».
  await expect.poll(() => m.actions.map((a) => a.clave ?? a.accion)).toEqual(expect.arrayContaining(['ingreso', 'mis_insignias']));
});

test('aviso «¡Ganaste una insignia!»: aparece con la imagen, nombre y descripción, y se cierra', async ({ page }) => {
  const m = await mockApi(page);
  m.pendingNew = [fresh];
  await init(page);
  // En una pantalla con encabezado y pestañas (Guía) el aviso queda centrado igual.
  await page.goto('/guia');

  await expect(notice(page)).toBeVisible();
  await expect(notice(page)).toContainText('¡Ganaste una insignia!');
  await expectCentered(page);
  await expect(notice(page)).toContainText('Con cara');
  await expect(notice(page)).toContainText('Puso su foto de perfil');
  await expect(notice(page).locator('.badge-art img')).toHaveAttribute('src', IMG);
  await notice(page).getByRole('button', { name: 'Continuar' }).click();
  await expect(notice(page)).toBeHidden();
  // No se repite al recargar (ya se mostró).
  await page.goto('/inicio');
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Hola');
  await page.waitForTimeout(1200);
  await expect(notice(page)).toBeHidden();
});

test('el aviso NO aparece con una alerta activa: queda en cola y se muestra al terminarla', async ({ page }) => {
  const m = await start(page);
  await activateAlert(page);

  // Durante la alerta, en la pantalla de alerta, llega una insignia nueva (la app la descarga al abrir).
  await page.waitForTimeout(1500);
  m.pendingNew = [fresh];
  await page.reload();
  await expect.poll(() => m.pendingNew.length).toBe(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sismo:v1:insignias_aviso') ?? '')).toContain('Con cara');
  await page.waitForTimeout(800);
  await expect(notice(page)).toBeHidden();

  // Tampoco fuera de la pantalla de alerta mientras siga activa (Inicio).
  await page.goto('/inicio');
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Hola');
  await page.waitForTimeout(800);
  await expect(notice(page)).toBeHidden();
  // Se vuelve a la alerta desde Inicio (como lo haría la persona).
  await view(page).locator('.status-card--alert').click();
  await expect(page).toHaveURL(/\/alerta$/);

  // Al finalizar la alerta («Estoy a salvo») aparece el aviso que esperaba.
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo/);
  await expect(notice(page)).toBeVisible();
  await expectCentered(page);
  await expect(notice(page)).toContainText('Con cara');
  await notice(page).getByRole('button', { name: 'Continuar' }).click();
  await expect(notice(page)).toBeHidden();
  await expect.poll(() => m.actions.map((a) => a.clave)).toContain('estoy_a_salvo');
});

test('foto de perfil: se reduce y sube desde la galería, se ve en Configuración y se puede quitar', async ({ page }) => {
  const m = await start(page);
  await page.goto('/configuracion');
  const v = view(page);
  const card = v.locator('.photo-card');
  await expect(card).toContainText('Su foto la verán el centro de monitoreo y sus contactos en los correos de alerta. Puede quitarla cuando quiera.');
  await expect(card.locator('.avatar__initials')).toHaveText('AD');
  await expect(card.getByRole('button', { name: 'Tomar foto' })).toBeEnabled();
  await expect(card.locator('input[capture="user"]')).toHaveAttribute('accept', 'image/*');

  await card.getByTestId('foto-galeria').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.locator('ion-toast')).toContainText('Foto de perfil actualizada');
  // Se subió ya reducida a JPEG (canvas) y se muestra con la URL firmada.
  expect(m.uploads).toHaveLength(1);
  expect(m.uploads[0]).toMatch(/^data:image\/jpeg;base64,/);
  await expect(card.getByRole('img', { name: 'Foto de Ana Demo' })).toHaveAttribute('src', PHOTO);
  await expect.poll(() => m.actions.map((a) => a.clave)).toContain('foto_perfil');

  // Un archivo que no es imagen se rechaza antes de procesarlo.
  await expect(page.locator('ion-toast', { hasText: 'Foto de perfil actualizada' })).toBeHidden({ timeout: 8000 });
  await card.getByTestId('foto-camara').setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') });
  await expect(page.locator('ion-toast', { hasText: 'no es una imagen' })).toBeVisible();
  expect(m.uploads).toHaveLength(1);

  // Quitar, con confirmación.
  await card.getByRole('button', { name: 'Quitar foto' }).click();
  const dialog = page.locator('ion-alert', { hasText: '¿Quitar la foto?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Quitar foto' }).click();
  await expect.poll(() => m.deletes).toBe(1);
  await expect(card.locator('.avatar__initials')).toHaveText('AD');
  await expect(card.getByRole('button', { name: 'Quitar foto' })).toHaveCount(0);
});

test('regresión: una copia vieja guardada se reemplaza por la respuesta del servidor al abrir Inicio e Insignias', async ({ page }) => {
  const m = await mockApi(page);
  let gets = 0;
  page.on('request', (r) => {
    if (r.url() === `${API}/insignias` && r.method() === 'GET') gets++;
  });
  await page.addInitScript((api) => localStorage.setItem('sismo:v1:api_pruebas', api), API);
  await page.goto('/');
  // Copia vieja de otra sesión: 0 ganadas de 50.
  await page.evaluate(() => {
    localStorage.setItem('sismo:v1:data', JSON.stringify({ version: 1, settings: { onboarded: true, userName: 'Ana Demo' } }));
    localStorage.setItem('sismo:v1:insignias', JSON.stringify({ ganadas: [], por_ganar: [], secretas: [], vencidas: [], nuevas: [], perfil: null, total: 50 }));
  });
  await page.goto('/inicio');
  await expect(view(page).locator('.my-badges-card')).toContainText('1 de 100 ganadas');
  await view(page).locator('.my-badges-card').getByRole('button', { name: 'Ver mis insignias' }).click();
  await expect(view(page).locator('.badges-header__total')).toContainText('1/100');
  const before = gets;
  // Al volver a Inicio se pide de nuevo.
  await page.goBack();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect.poll(() => gets).toBeGreaterThan(before);
  expect(m.uploads).toHaveLength(0);
});

test('foto sin internet: queda «Pendiente de subir», se ve de inmediato y se sube sola al volver la conexión', async ({ page, context }) => {
  const m = await start(page);
  await page.goto('/configuracion');
  const card = view(page).locator('.photo-card');
  await expect(card.getByRole('button', { name: 'Elegir de la galería' })).toBeEnabled();

  await context.setOffline(true);
  await expect(card).toContainText('Sin internet: la foto se subirá sola cuando vuelva la conexión');
  await card.getByTestId('foto-galeria').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.locator('ion-toast', { hasText: 'se subirá sola' })).toBeVisible();
  await expect(card.locator('.pending-tag')).toHaveText('Pendiente de subir');
  // Se ve ya la copia local reducida (JPEG) y cuenta para «Perfil completado».
  await expect(card.getByRole('img', { name: 'Foto de Ana Demo' })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  expect(m.uploads).toHaveLength(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sismo:v1:foto_pendiente') ?? 'null'));
  expect(stored).toMatchObject({ op: 'upload' });

  await context.setOffline(false);
  await expect.poll(() => m.uploads.length).toBe(1);
  expect(m.uploads[0]).toMatch(/^data:image\/jpeg;base64,/);
  await expect(card.getByRole('img', { name: 'Foto de Ana Demo' })).toHaveAttribute('src', PHOTO);
  await expect(card.locator('.pending-tag')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sismo:v1:foto_pendiente'))).toBeNull();
});

test('«Ver mis insignias» en el aviso: lleva a la página, cierra todos los avisos y las marca «Nueva» hasta verlas', async ({ page }) => {
  const m = await mockApi(page);
  m.pendingNew = [fresh, { ...fresh, id: 8, nivel: 'plata', nombre: 'Ruta clara', descripcion: 'Vio la ruta al punto de encuentro' }];
  await init(page);
  await page.goto('/inicio');

  await expect(notice(page)).toBeVisible();
  await expect(notice(page)).toContainText('Con cara');
  await expect(notice(page)).toContainText('Y 1 más esperando');
  await notice(page).getByRole('button', { name: 'Ver mis insignias' }).click();
  await expect(page).toHaveURL(/\/insignias$/);
  await expect(notice(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sismo:v1:insignias_aviso'))).toBeNull();

  // Las dos aparecen con «Nueva» en Ganadas; tras verlas unos segundos se quita la marca.
  const list = view(page).locator('.badge-list[aria-label="Ganadas"]');
  await expect(list.locator('.badge-item', { hasText: 'Con cara' }).locator('.badge-new')).toHaveText('Nueva');
  await expect(list.locator('.badge-item', { hasText: 'Ruta clara' }).locator('.badge-new')).toHaveText('Nueva');
  await expect(list.locator('.badge-new')).toHaveCount(0, { timeout: 10_000 });

  // No vuelven a aparecer como aviso.
  await page.goto('/inicio');
  await expect(view(page).getByRole('heading', { level: 1 })).toContainText('Hola');
  await page.waitForTimeout(1200);
  await expect(notice(page)).toHaveCount(0);
  await expect(view(page).locator('.my-badges-card .new-dot')).toHaveCount(0);
});
