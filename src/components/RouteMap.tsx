// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/useT';

interface Props {
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  /** Trazado [lat, lng] de la ruta, o null mientras se calcula / si no hay. */
  path: [number, number][] | null;
}

/**
 * Mapa (Leaflet + OpenStreetMap) con la ruta hasta el punto de encuentro: origen en rojo, destino en verde
 * y la ruta en azul. Se carga de forma diferida como el mapa real.
 */
export default function RouteMap({ from, to, path }: Props) {
  const t = useT().components.map;
  const container = useRef<HTMLDivElement>(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const map = L.map(el, { zoomControl: true, attributionControl: true });
    let loaded = 0;
    setTilesFailed(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    })
      .on('tileload', () => {
        loaded++;
        setTilesFailed(false);
      })
      .on('tileerror', () => {
        if (loaded === 0) setTilesFailed(true);
      })
      .addTo(map);

    const a: L.LatLngExpression = [from.latitude, from.longitude];
    const b: L.LatLngExpression = [to.latitude, to.longitude];
    L.circleMarker(a, { radius: 8, className: 'real-map__pin' }).addTo(map);
    L.circleMarker(b, { radius: 9, className: 'real-map__meeting' }).addTo(map);
    const line = path ? L.polyline(path, { className: 'route-map__line', weight: 5 }).addTo(map) : null;

    const frame = () => {
      map.invalidateSize();
      map.fitBounds(line ? line.getBounds() : L.latLngBounds([a, b]), { padding: [24, 24], maxZoom: 17 });
    };
    frame();
    // Las transiciones de Ionic cambian el tamaño: se recalcula para que no quede gris ni mal encuadrado.
    const observer = new ResizeObserver(frame);
    observer.observe(el);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [from.latitude, from.longitude, to.latitude, to.longitude, path]);

  return (
    <div className="route-map">
      <div ref={container} className="route-map__canvas" />
      {tilesFailed && <p className="callout callout--warning small real-map__warning">{t.tilesFailed}</p>}
    </div>
  );
}
