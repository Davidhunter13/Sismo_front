// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Genera las evidencias visuales (app real en producción) y de código fuente (archivos reales del repositorio).
import { expect, test, type Page } from '@playwright/test';
import hljs from 'highlight.js';
import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { activateAlert, view } from './helpers';

const ROOT = process.cwd();
const VISUAL = join(ROOT, 'screenshots', 'visual');
const CODE = join(ROOT, 'screenshots', 'codigo');
mkdirSync(VISUAL, { recursive: true });
mkdirSync(CODE, { recursive: true });

const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function settle(page: Page) {
  await page.waitForTimeout(700); // transiciones de Ionic
  await expect(page.locator('ion-toast')).toHaveCount(0, { timeout: 6000 });
}

// Con diálogos/modales se permiten animaciones: 'disabled' cancela la animación de Ionic y oculta el overlay.
async function shot(page: Page, name: string, overlay = false) {
  await page.screenshot({ path: join(VISUAL, name), animations: overlay ? 'allow' : 'disabled' });
}

test('capturas visuales', async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ ...MOBILE, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const page = await context.newPage();

  await page.goto('/bienvenida');
  await settle(page);
  await shot(page, '01-bienvenida.png');

  await view(page).getByRole('button', { name: 'Comenzar' }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await settle(page);
  await shot(page, '02-inicio.png');

  await view(page).getByRole('button', { name: 'Activar alerta de emergencia' }).click();
  await expect(page.locator('ion-alert')).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '03-confirmacion-alerta.png', true);
  await page.locator('ion-alert').getByRole('button', { name: 'Cancelar' }).click();
  await page.waitForTimeout(500);

  await activateAlert(page, 'Sismo');
  // Espera a que termine la entrega SIMULADA (rotulada en pantalla como «Simulación»).
  await expect(view(page).locator('.badge', { hasText: 'Enviada' })).toBeVisible({ timeout: 8000 });
  await settle(page);
  await shot(page, '04-alerta-activa.png');
  await view(page).getByRole('button', { name: /Finalizar alerta/ }).click();
  await page.locator('ion-alert').getByRole('button', { name: 'Finalizar' }).click();
  await expect(page).toHaveURL(/\/despues-del-sismo\?alerta=/);
  await settle(page);

  await page.goto('/ubicacion');
  await view(page).getByRole('button', { name: 'Usar coordenadas de prueba' }).click();
  await settle(page);
  await shot(page, '05-ubicacion.png');

  await page.goto('/contactos');
  await settle(page);
  await shot(page, '06-contactos.png');

  await view(page).getByRole('button', { name: 'Agregar', exact: true }).click();
  const modal = page.locator('ion-modal');
  await expect(modal).toBeVisible();
  await modal.locator('ion-input[label="Nombre"] input').fill('Pedro (demo)');
  await modal.locator('ion-input[label="Teléfono"] input').fill('300 000 0004');
  await modal.locator('ion-select').click();
  await page.locator('ion-popover').getByText('Amigo/a', { exact: true }).click();
  await page.waitForTimeout(700);
  await shot(page, '07-agregar-contacto.png', true);

  await page.goto('/historial');
  await settle(page);
  await shot(page, '08-historial.png');

  await page.goto('/guia');
  await settle(page);
  await shot(page, '09-guia-emergencia.png');

  await page.goto('/configuracion');
  await settle(page);
  await shot(page, '10-configuracion.png');

  // 11-sin-conexion: no se genera porque la app no implementa un estado sin conexión.

  const storage = await context.storageState();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const dpage = await desktop.newPage();
  await dpage.goto('/inicio');
  await settle(dpage);
  await dpage.screenshot({ path: join(VISUAL, '12-vista-escritorio.png'), animations: 'disabled' });

  await desktop.close();
  await context.close();
});

// ---------- Capturas del código fuente ----------

const IGNORE = new Set(['node_modules', 'dist', 'test-results', 'playwright-report', 'screenshots', '.git']);

function tree(dir: string, prefix = ''): string[] {
  const entries = readdirSync(dir)
    .filter((e) => !IGNORE.has(e))
    .sort((a, b) => Number(statSync(join(dir, b)).isDirectory()) - Number(statSync(join(dir, a)).isDirectory()) || a.localeCompare(b));
  return entries.flatMap((e, i) => {
    const last = i === entries.length - 1;
    const full = join(dir, e);
    const isDir = statSync(full).isDirectory();
    const line = `${prefix}${last ? '└── ' : '├── '}${e}${isDir ? '/' : ''}`;
    return isDir ? [line, ...tree(full, prefix + (last ? '    ' : '│   '))] : [line];
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 400 }, deviceScaleFactor: 2 });

  const structure = ['sismo/', ...tree(ROOT)].join('\n');
  await codeShot(page, '13-estructura-proyecto.png', `Estructura del proyecto · ${relative(ROOT, ROOT) || 'sismo'}`, structure, null);

  const pkg = lines('package.json');
  await codeShot(page, '14-package-json.png', 'package.json', pkg.code, 'json');

  const app = lines('src/App.tsx', findLine('src/App.tsx', "import { IonApp"));
  await codeShot(page, '15-navegacion-rutas.png', 'src/App.tsx — rutas (React Router + IonRouterOutlet)', app.code, 'typescript', app.start);

  const panic = lines('src/components/PanicButton.tsx', 2);
  await codeShot(page, '16-componente-boton-panico.png', 'src/components/PanicButton.tsx', panic.code, 'typescript', panic.start);

  const f = 'src/context/AppStateProvider.tsx';
  const from = findLine(f, 'Simulación del canal digital');
  const to = findLine(f, 'const setLocation =') - 2;
  const logic = lines(f, from, to);
  await codeShot(page, '17-logica-alertas.png', `${f} — activación, simulación y cierre de alertas`, logic.code, 'typescript', logic.start);

  await page.close();
});
