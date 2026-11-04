// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Genera las evidencias visuales (app real en producción) y de código fuente (archivos reales del repositorio).
// Cada ejecución guarda en screenshots/<AAAA-MM-DD>/visual/visual_front y codigo/codigo_front (las de otras fechas se conservan).
// Las del backend (panel) van en visual/visual_back y codigo/codigo_back.
// Los datos son ficticios (nombres «demo», teléfonos de prueba y correos @example.com).
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import hljs from 'highlight.js';
import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { view } from './helpers';

const ROOT = process.cwd();
/** Fecha local de Colombia (AAAA-MM-DD); se puede fijar con SCREENSHOT_DATE. */
const DATE = process.env.SCREENSHOT_DATE ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const VISUAL = join(ROOT, 'screenshots', DATE, 'visual', 'visual_front');
const CODE = join(ROOT, 'screenshots', DATE, 'codigo', 'codigo_front');
mkdirSync(VISUAL, { recursive: true });
mkdirSync(CODE, { recursive: true });

const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-CO', timezoneId: 'America/Bogota' };
// Lugares ficticios en Bogotá: casa, parque y donde está la persona al activar el SOS (a unos cientos de metros).
const HERE = { latitude: 4.6281, longitude: -74.0736, accuracy: 12 };
const PARK = { latitude: 4.6322, longitude: -74.0702, accuracy: 12 };
const AWAY = { latitude: 4.6301, longitude: -74.0758, accuracy: 15 };

async function settle(page: Page) {
  await page.waitForTimeout(700); // transiciones de Ionic
  await expect(page.locator('ion-toast')).toHaveCount(0, { timeout: 6000 });
}

// Con diálogos/modales se permiten animaciones: 'disabled' cancela la animación de Ionic y oculta el overlay.
async function shot(page: Page, name: string, overlay = false) {
  await page.screenshot({ path: join(VISUAL, name), animations: overlay ? 'allow' : 'disabled' });
}

async function full(page: Page, name: string) {
  await page.screenshot({ path: join(VISUAL, name), animations: 'disabled', fullPage: true });
}

async function newMobile(browser: Browser, extra: Parameters<Browser['newContext']>[0] = {}): Promise<BrowserContext> {
  const context = await browser.newContext({ ...MOBILE, ...extra });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(HERE);
  return context;
}

async function scrollTo(page: Page, selector: string) {
  await view(page).locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

test('capturas visuales: registro y uso real (sin demostración)', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await newMobile(browser);
  // Batería simulada al 15 % para mostrar el ahorro automático durante la alerta.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'getBattery', { value: async () => ({ level: 0.15, charging: false }), configurable: true });
  });
  const page = await context.newPage();
  const v = view(page);

  await page.goto('/bienvenida');
  await settle(page);
  await shot(page, '01-bienvenida.png');

  await v.locator('ion-toggle').click();
  await v.getByRole('button', { name: 'Comenzar' }).click();
  await expect(page).toHaveURL(/\/registro$/);
  await v.locator('ion-input[label="Nombre de usuario"] input').fill('Ana Demo');
  await page.waitForTimeout(300);
  await shot(page, '02-registro-1-nombre.png');
  await v.getByRole('button', { name: 'Siguiente' }).click();
  await settle(page);

  await v.getByRole('button', { name: 'Obtener mi ubicación' }).click();
  await expect(v.getByText(/Ubicación obtenida\./)).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await shot(page, '03-registro-2-ubicacion.png');
  await v.getByRole('button', { name: 'Siguiente' }).click();

  // Dos puntos en lugares distintos: «Casa» aquí y «Parque del barrio» tras moverse (Atrás → nueva ubicación).
  const label = v.locator('ion-input[label="Nombre del punto"] input');
  await label.fill('Casa');
  await v.getByRole('button', { name: 'Mi ubicación actual' }).click();
  await v.getByRole('button', { name: 'Atrás' }).click();
  await context.setGeolocation(PARK);
  await v.getByRole('button', { name: 'Obtener mi ubicación' }).click();
  await expect(v.getByText(/4.63220/)).toBeVisible({ timeout: 15_000 });
  await v.getByRole('button', { name: 'Siguiente' }).click();
  await label.fill('Parque del barrio');
  await v.getByRole('button', { name: 'Mi ubicación actual' }).click();
  await settle(page);
  await shot(page, '04-registro-3-puntos-de-encuentro.png');
  await v.getByRole('button', { name: 'Siguiente' }).click();

  await v.getByRole('button', { name: 'Agregar contacto' }).click();
  const modal = page.locator('ion-modal');
  await modal.locator('ion-input[label="Nombre"] input').fill('Luisa Demo');
  await modal.locator('ion-input[label="Teléfono"] input').fill('300 000 0001');
  await modal.locator('ion-input[label="Correo electrónico"] input').fill('luisa@example.com');
  await modal.getByRole('radio', { name: 'Familiar' }).click();
  await page.waitForTimeout(600);
  await shot(page, '05-registro-4-nuevo-contacto.png', true);
  await modal.getByRole('button', { name: 'Agregar contacto' }).click();
  await settle(page);
  await shot(page, '06-registro-4-contactos.png');
  await v.getByRole('button', { name: 'Finalizar registro' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await settle(page);
  await shot(page, '07-inicio.png');

  // La persona está en otro lugar al activar el SOS: la brújula y la ruta guían al punto más cercano.
  await context.setGeolocation(AWAY);
  // SOS: diálogo, pregunta del correo y alerta activa con el ahorro de batería automático.
  await v.getByRole('button', { name: 'Activar alerta de emergencia' }).click();
  await expect(page.locator('ion-alert')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '08-sos-tipo-de-evento.png', true);
  await page.locator('ion-alert').getByRole('radio', { name: 'Sismo' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Activar alerta' }).click();
  await expect(page).toHaveURL(/\/alerta$/);
  const email = page.getByRole('alertdialog', { name: '¿Enviar correo a sus contactos?' });
  await expect(email).toBeVisible();
  await page.waitForTimeout(500);
  await shot(page, '09-alerta-pregunta-correo.png', true);
  await email.getByRole('button', { name: 'No enviar' }).click();
  await expect(v.getByText(/se activó el modo ahorro/)).toBeVisible({ timeout: 10_000 });
  await settle(page);
  await shot(page, '10-alerta-activa.png');
  await scrollTo(page, '.trapped-card');
  await shot(page, '11-alerta-ahorro-bateria.png');
  await v.getByRole('button', { name: 'Avisar a mis contactos' }).click();
  await page.waitForTimeout(600);
  await shot(page, '12-alerta-avisar-bateria-baja.png', true);
  await page.locator('ion-action-sheet').getByRole('button', { name: 'Ahora no' }).click();
  await page.waitForTimeout(400);

  // Finalizar: «Estoy bien» por SMS o WhatsApp y lista «Después del sismo» con brújula y ruta.
  await v.getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page.locator('ion-action-sheet')).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, '13-estoy-bien-canal.png', true);
  await page.locator('ion-action-sheet').getByRole('button', { name: 'Ahora no' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo/);
  await settle(page);
  await shot(page, '14-despues-del-sismo.png');
  await page.waitForTimeout(2500); // ruta real (OpenStreetMap)
  await full(page, '15-despues-del-sismo-completo.png');

  await page.goto('/ubicacion');
  await settle(page);
  await view(page).locator('ion-segment-button[value="real"]').click();
  await page.waitForTimeout(3000); // mosaicos del mapa real
  await shot(page, '16-ubicacion-mapa-real.png');
  await scrollTo(page, '#brujula');
  await shot(page, '17-brujula-varios-puntos.png');
  await scrollTo(page, '#ruta');
  await page.waitForTimeout(2500);
  await shot(page, '18-ruta-al-punto-de-encuentro.png');

  await page.goto('/contactos');
  await settle(page);
  await shot(page, '19-contactos.png');

  await page.goto('/configuracion');
  await settle(page);
  await full(page, '20-configuracion-completa.png');
  await context.close();
});

test('capturas visuales: datos faltantes tras un SOS durante el registro', async ({ browser }) => {
  const context = await newMobile(browser);
  const page = await context.newPage();
  const v = view(page);
  await page.goto('/bienvenida');
  await v.locator('ion-toggle').click();
  await v.getByRole('button', { name: 'Comenzar' }).click();
  await v.locator('ion-input[label="Nombre de usuario"] input').fill('');
  await settle(page);
  await shot(page, '21-registro-sos-disponible.png');
  await v.getByRole('button', { name: 'SOS · Emergencia ahora' }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Cancelar' }).click();
  await settle(page);
  await shot(page, '22-inicio-datos-faltantes.png');
  await page.goto('/ubicacion');
  await settle(page);
  await full(page, '23-ubicacion-datos-faltantes.png');
  await context.close();
});

test('capturas visuales: modo de demostración, otras pantallas, tema oscuro, inglés y escritorio', async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await newMobile(browser);
  const page = await context.newPage();
  const v = view(page);

  await page.goto('/bienvenida');
  await v.getByRole('button', { name: 'Comenzar' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await settle(page);
  await shot(page, '24-inicio-demostracion.png');
  await full(page, '25-inicio-completo.png');

  const pages: [string, string][] = [
    ['/historial', '26-historial.png'],
    ['/historial/demo-a1', '27-detalle-de-alerta.png'],
    ['/guia', '28-guia-de-emergencia.png'],
    ['/mochila', '29-mochila-de-emergencia.png'],
    ['/ficha-medica', '30-ficha-medica.png'],
    ['/simulacro', '31-simulacro.png'],
    ['/estadisticas', '32-estadisticas.png'],
    ['/sismos', '33-sismos-recientes.png'],
    ['/encuesta', '34-encuesta-sus.png'],
  ];
  for (const [path, name] of pages) {
    await page.goto(path);
    await settle(page);
    if (path === '/sismos') await page.waitForTimeout(2500); // catálogo real del USGS
    await shot(page, name);
  }

  await page.goto('/inicio');
  await page.emulateMedia({ colorScheme: 'dark' });
  await settle(page);
  await shot(page, '35-inicio-tema-oscuro.png');

  const storage = await context.storageState();
  await context.close();

  const english = await browser.newContext({ ...MOBILE, storageState: storage, locale: 'en-US' });
  const epage = await english.newPage();
  await epage.goto('/configuracion');
  await view(epage).locator('ion-segment-button[value="en"]').click();
  await epage.goto('/inicio');
  await settle(epage);
  await shot(epage, '36-inicio-ingles.png');
  await english.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const dpage = await desktop.newPage();
  await dpage.goto('/inicio');
  await settle(dpage);
  await dpage.screenshot({ path: join(VISUAL, '37-vista-escritorio.png'), animations: 'disabled' });
  await desktop.close();
});

// ---------- Capturas del código fuente ----------

const IGNORE = new Set(['node_modules', 'dist', 'test-results', 'playwright-report', 'screenshots', '.git', 'android', 'assets', 'public']);

function tree(dir: string, prefix = ''): string[] {
  const entries = readdirSync(dir)
    .filter((e) => !IGNORE.has(e) && !e.startsWith('.'))
    .sort((a, b) => Number(statSync(join(dir, b)).isDirectory()) - Number(statSync(join(dir, a)).isDirectory()) || a.localeCompare(b));
  return entries.flatMap((e, i) => {
    const last = i === entries.length - 1;
    const p = join(dir, e);
    const isDir = statSync(p).isDirectory();
    const line = `${prefix}${last ? '└── ' : '├── '}${e}${isDir ? '/' : ''}`;
    return isDir ? [line, ...tree(p, prefix + (last ? '    ' : '│   '))] : [line];
  });
}

function lines(file: string, from = 1, to?: number) {
  const all = readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n').split('\n');
  return { code: all.slice(from - 1, to ?? all.length).join('\n'), start: from };
}

function findLine(file: string, needle: string): number {
  const idx = readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n').split('\n').findIndex((l) => l.includes(needle));
  if (idx < 0) throw new Error(`No se encontró «${needle}» en ${file}`);
  return idx + 1;
}

/** Bloque de un archivo entre dos marcas de texto (incluida la primera, excluida la segunda). */
function between(file: string, startNeedle: string, endNeedle?: string) {
  const from = findLine(file, startNeedle);
  const to = endNeedle ? findLine(file, endNeedle) - 1 : undefined;
  return lines(file, from, to);
}

async function codeShot(page: Page, name: string, title: string, code: string, lang: string | null, start = 1) {
  const html = lang ? hljs.highlight(code, { language: lang }).value : code.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const numbered = html.split('\n').map((l, i) => `<span class="ln">${start + i}</span>${l || ' '}`).join('\n');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#1e1e1e;font-family:Consolas,'Cascadia Code',monospace}
    .win{display:inline-block;min-width:100%}
    .bar{background:#2d2d2d;color:#ccc;font:13px 'Segoe UI',sans-serif;padding:9px 16px;display:flex;gap:8px;align-items:center}
    .dot{width:12px;height:12px;border-radius:50%;display:inline-block}
    pre{margin:0;padding:16px 20px;color:#d4d4d4;font-size:14px;line-height:1.55;white-space:pre}
    .ln{display:inline-block;width:3em;color:#6e7681;text-align:right;margin-right:18px;user-select:none}
    .hljs-keyword,.hljs-built_in{color:#569cd6}.hljs-string{color:#ce9178}.hljs-comment{color:#6a9955}
    .hljs-title,.hljs-title.function_{color:#dcdcaa}.hljs-attr,.hljs-property{color:#9cdcfe}.hljs-number,.hljs-literal{color:#b5cea8}
    .hljs-tag,.hljs-name{color:#4ec9b0}.hljs-type,.hljs-title.class_{color:#4ec9b0}.hljs-variable,.hljs-params{color:#9cdcfe}
  </style></head><body><div class="win"><div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span>&nbsp; ${title}</div><pre>${numbered}</pre></div></body></html>`);
  await page.screenshot({ path: join(CODE, name), fullPage: true });
}

test('capturas de código', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 });

  const structure = ['sismo/', ...tree(ROOT)].join('\n');
  await codeShot(page, '01-estructura-proyecto.png', `Estructura del proyecto · ${relative(ROOT, ROOT) || 'sismo'} (sin android/, node_modules/ ni archivos generados)`, structure, null);

  await codeShot(page, '02-package-json.png', 'package.json', lines('package.json').code, 'json');

  const routes = between('src/App.tsx', '      <IonRouterOutlet>', '      </IonRouterOutlet>');
  await codeShot(page, '03-navegacion-rutas.png', 'src/App.tsx — rutas (React Router + IonRouterOutlet)', routes.code, 'xml', routes.start);

  const panic = lines('src/components/PanicButton.tsx', 2);
  await codeShot(page, '04-componente-boton-panico.png', 'src/components/PanicButton.tsx', panic.code, 'typescript', panic.start);

  const setup = between('src/pages/SetupPage.tsx', 'const STEPS', 'const locate = async');
  await codeShot(page, '05-registro-obligatorio.png', 'src/pages/SetupPage.tsx — registro obligatorio de 4 pasos', setup.code, 'typescript', setup.start);

  const gaps = lines('src/utils/setupGaps.ts', 2);
  await codeShot(page, '06-datos-faltantes.png', 'src/utils/setupGaps.ts — datos necesarios que faltan (borde rojo)', gaps.code, 'typescript', gaps.start);

  const points = lines('src/utils/meetingPoints.ts', 2);
  await codeShot(page, '07-puntos-de-encuentro.png', 'src/utils/meetingPoints.ts — varios puntos y el más cercano', points.code, 'typescript', points.start);

  const sms = between('src/services/smsService.ts', 'export function buildAlertMessage', 'export function whatsappNumber');
  await codeShot(page, '08-mensajes-sms-whatsapp.png', 'src/services/smsService.ts — aviso de alerta, «Estoy bien» y batería baja', sms.code, 'typescript', sms.start);

  const battery = between('src/pages/AlertPage.tsx', '  // Ahorro automático:', '  // Reloj para la duración');
  await codeShot(page, '09-ahorro-bateria-automatico.png', 'src/pages/AlertPage.tsx — ahorro de batería automático', battery.code, 'typescript', battery.start);

  const gps = lines('src/components/useLocationAutoRefresh.ts', 2);
  await codeShot(page, '10-ubicacion-cada-5-minutos.png', 'src/components/useLocationAutoRefresh.ts — ubicación cada 5 minutos', gps.code, 'typescript', gps.start);

  const widget = 'android/app/src/main/java/co/edu/poli/sismo/SosWidgetProvider.java';
  const w = between(widget, '/**', '    private RemoteViews buildViews');
  await codeShot(page, '11-widget-doble-toque.png', `${widget.replace('android/app/src/main/java/', '')} — widget SOS con doble toque`, w.code, 'java', w.start);

  const layout = lines('android/app/src/main/res/layout/widget_sos_large.xml', 2);
  await codeShot(page, '12-widget-diseno-2x2.png', 'res/layout/widget_sos_large.xml — diseño del widget 2×2', layout.code, 'xml', layout.start);

  const theme = between('src/styles/theme.css', ':root', '  --ion-color-primary:');
  await codeShot(page, '13-paleta-de-colores.png', 'src/styles/theme.css — paleta de colores (tema claro)', theme.code, 'css', theme.start);

  await page.close();
});
