// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import type { Quake } from '../services/quakeService';
import { layoutSpikes, type Spike } from '../utils/quakeViz';

const H = 200;
const PAD = { padLeft: 34, padRight: 12, padTop: 26, padBottom: 26 };

/**
 * Gráfica de picos tipo sismógrafo (SVG propio, sin librerías): cada sismo es un pico vertical en su hora;
 * la altura es la magnitud (un solo eje) y el rojo se intensifica con ella. Tocar o pasar el mouse muestra el
 * detalle; el más fuerte lleva etiqueta directa. La lista de abajo es la vista en tabla de los mismos datos.
 */
export function QuakeSpikeChart({ quakes, from, to, locale }: { quakes: Quake[]; from: number; to: number; locale: string }) {
  const t = useT().quakes;
  const [active, setActive] = useState<string | null>(null);
  // Ancho real del contenedor: el SVG se dibuja en píxeles reales (sin estirar textos ni puntos).
  const plotRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const node = plotRef.current;
    if (!node) return;
    const measure = () => setW(Math.max(260, Math.round(node.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const layout = useMemo(() => layoutSpikes(quakes, { from, to, width: W, height: H, ...PAD }), [quakes, from, to, W]);
  const byId = useMemo(() => new Map(quakes.map((q) => [q.id, q])), [quakes]);
  const weekly = to - from > 2 * 86_400_000;
  const tick = (time: number) => new Date(time).toLocaleString(locale, weekly ? { weekday: 'short', day: 'numeric' } : { hour: '2-digit', minute: '2-digit' });
  const shown = active ? layout.spikes.find((s) => s.id === active) ?? null : null;
  const fmtMag = (m: number) => m.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // Ancho del área táctil de cada pico: mayor que la marca (mínimo 14 px en el sistema de la gráfica).
  const hit = Math.max(14, Math.min(28, (W - PAD.padLeft - PAD.padRight) / Math.max(1, quakes.length)));

  const tooltip = (s: Spike) => {
    const q = byId.get(s.id);
    if (!q) return null;
    const left = Math.min(Math.max((s.x / W) * 100, 18), 82);
    return (
      <div className="spike-tip" style={{ left: `${left}%` }} role="status">
        <strong>{t.magnitude(fmtMag(q.magnitude))}</strong>
        <span>{q.place}</span>
        <small>{new Date(q.time).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}{t.depth(Math.round(q.depthKm))}</small>
      </div>
    );
  };

  return (
    <figure className="spike-chart">
      <div className="spike-chart__plot" ref={plotRef} onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chartLabel(quakes.length)}>
          {layout.yTicks.map((y) => (
            <g key={y.value} className="spike-chart__grid">
              <line x1={PAD.padLeft} x2={W - PAD.padRight} y1={y.y} y2={y.y} />
              <text x={PAD.padLeft - 6} y={y.y + 4} textAnchor="end">M{y.value}</text>
            </g>
          ))}
          {layout.xTicks.map((x) => (
            <text key={x.time} className="spike-chart__x" x={x.x} y={H - 8} textAnchor="middle">{tick(x.time)}</text>
          ))}
          {layout.spikes.map((s) => (
            <g key={s.id} className={`spike spike--${s.level}${active === s.id ? ' spike--on' : ''}`}>
              <line x1={s.x} x2={s.x} y1={layout.baseline} y2={s.y} />
              <circle cx={s.x} cy={s.y} r={active === s.id ? 6 : 4.5} />
              <rect className="spike__hit" x={s.x - hit / 2} y={PAD.padTop - 10} width={hit} height={layout.baseline - PAD.padTop + 10}
                tabIndex={0} aria-label={`${t.magnitude(fmtMag(s.magnitude))}, ${byId.get(s.id)?.place ?? ''}`}
                onMouseEnter={() => setActive(s.id)} onFocus={() => setActive(s.id)} onBlur={() => setActive(null)}
                onClick={() => setActive(s.id)} />
            </g>
          ))}
          {layout.strongest && !active && (
            <text className="spike-chart__label" x={Math.min(Math.max(layout.strongest.x, 60), W - 60)} y={Math.max(layout.strongest.y - 10, 12)} textAnchor="middle">
              {t.strongest}: M{fmtMag(layout.strongest.magnitude)}
            </text>
          )}
        </svg>
        {shown && tooltip(shown)}
      </div>
      <figcaption className="spike-chart__legend">
        {(['low', 'mid', 'high'] as const).map((l) => (
          <span key={l}><i className={`spike-key spike-key--${l}`} aria-hidden="true" />{t.levels[l]}</span>
        ))}
      </figcaption>
    </figure>
  );
}
