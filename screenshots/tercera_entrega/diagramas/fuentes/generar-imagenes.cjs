// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Uso (desde la raíz del proyecto): npm i --no-save mermaid@11.4.1 && node screenshots/segunda_entrega/diagramas/fuentes/generar-imagenes.cjs [filtro]
// Convierte cada fuente (.mmd con Mermaid o .html) de screenshots/segunda_entrega/diagramas/fuentes en una imagen PNG individual.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));

const SRC = __dirname;
const OUT = path.resolve(__dirname, '..');
// La página auxiliar va en la carpeta temporal del sistema (nunca dentro de fuentes/).
const HERE = require('os').tmpdir().split(path.sep).join('/');
const MERMAID = path.join(ROOT, 'node_modules/mermaid/dist/mermaid.min.js').split(path.sep).join('/');
const solo = process.argv[2] || '';

const shell = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#fff;font-family:'Segoe UI',Inter,system-ui,sans-serif}
#wrap{display:inline-block;padding:28px 34px 30px;background:#fff}
#t{font-size:24px;font-weight:700;color:#0b2545;margin:0 0 4px}
#s{font-size:13px;color:#5b6578;margin:0 0 18px;border-bottom:3px solid #d62828;padding-bottom:10px}
#d svg{max-width:none!important;height:auto}
</style><script src="file:///${MERMAID}"></script></head>
<body><div id="wrap"><div id="t"></div><div id="s">SISMO · documentación técnica · ${new Date().toISOString().slice(0, 10)}</div><div id="d"></div></div></body></html>`;
fs.writeFileSync(HERE + '/sismo-diagramas.html', shell);

function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

(async () => {
  const b = await chromium.launch();
  const lista = archivos(SRC).filter((f) => /\.(mmd|html)$/.test(f) && f.replace(/\\/g, '/').includes(solo)).sort();
  let ok = 0;
  for (const f of lista) {
    const rel = path.relative(SRC, f).replace(/\\/g, '/').replace(/\.(mmd|html)$/, '.png');
    const dest = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const page = await b.newPage({ viewport: { width: 3000, height: 1200 }, deviceScaleFactor: 2 });
    try {
      if (f.endsWith('.html')) {
        await page.goto('file:///' + f.replace(/\\/g, '/'));
        await page.waitForTimeout(300);
        await page.screenshot({ path: dest, fullPage: true });
      } else {
        const src = fs.readFileSync(f, 'utf8');
        const title = (src.match(/^%% title: (.*)$/m) || [, path.basename(f)])[1];
        await page.goto('file:///' + HERE + '/sismo-diagramas.html');
        const err = await page.evaluate(async ([code, title]) => {
          document.getElementById('t').textContent = title;
          mermaid.initialize({
            startOnLoad: false, securityLevel: 'loose', theme: 'base',
            fontFamily: 'Segoe UI, Inter, system-ui, sans-serif',
            flowchart: { htmlLabels: true, curve: 'basis', padding: 12, nodeSpacing: 40, rankSpacing: 55 },
            sequence: { mirrorActors: false, actorMargin: 40, messageFontSize: 14 },
            er: { layoutDirection: 'TB', minEntityWidth: 120 },
            gantt: { barHeight: 26, fontSize: 13, sectionFontSize: 14, leftPadding: 420, gridLineStartPadding: 30 },
            themeVariables: {
              primaryColor: '#e8f0fa', primaryBorderColor: '#0b2545', primaryTextColor: '#1b2333',
              lineColor: '#0b2545', secondaryColor: '#fff3dc', tertiaryColor: '#f3f5f9',
              clusterBkg: '#f7f9fc', clusterBorder: '#9cb3d6', fontSize: '15px',
              actorBkg: '#e8f0fa', actorTextColor: '#0b2545', actorBorder: '#0b2545', actorLineColor: '#5b6578', signalColor: '#0b2545',
              noteBkgColor: '#fff3dc', noteBorderColor: '#8f5300', critBkgColor: '#d62828', critBorderColor: '#a61e1e',
              doneTaskBkgColor: '#9cb3d6', doneTaskBorderColor: '#0b2545', taskTextDarkColor: '#1b2333',
              cScale0: '#0b2545', cScale1: '#1d4e89', cScale2: '#d62828', cScale3: '#8f5300',
            },
          });
          try {
            const { svg } = await mermaid.render('g' + Math.random().toString(36).slice(2), code);
            document.getElementById('d').innerHTML = svg;
            const el = document.querySelector('#d svg');
            const vb = (el.getAttribute('viewBox') || '').split(/\s+/).map(Number);
            if (vb.length === 4) { el.setAttribute('width', vb[2]); el.setAttribute('height', vb[3]); }
            el.style.maxWidth = 'none';
            // UML: en casos de uso, las asociaciones actor–caso son líneas sin flecha (solo «include»/«extend» llevan flecha).
            if (/casos de uso/i.test(title)) {
              el.querySelectorAll('path').forEach((p) => {
                const punteada = /dotted|dashed/.test(p.getAttribute('class') || '') || (p.getAttribute('style') || '').includes('dasharray');
                if (!punteada && p.getAttribute('marker-end')) p.removeAttribute('marker-end');
              });
            }
            return null;
          } catch (e) { return String(e && e.message || e); }
        }, [src, title]);
        if (err) throw new Error(err);
        await page.waitForTimeout(200);
        await page.locator('#wrap').screenshot({ path: dest });
      }
      ok++;
      console.log('OK  ', rel);
    } catch (e) {
      console.log('ERR ', rel, '→', String(e.message).split('\n').slice(0, 3).join(' | '));
    }
    await page.close();
  }
  await b.close();
  console.log(ok + '/' + lista.length + ' imágenes');
})();
