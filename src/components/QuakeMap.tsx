// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { useT } from '../i18n/useT';
import type { Quake } from '../services/quakeService';
import { quakeDotSize, quakeLevel, quakePulseSeconds, quakeWaves } from '../utils/quakeViz';

/**
 * Mapa de los sismos del periodo (Leaflet + teselas de OpenStreetMap). Cada sismo es un punto rojo que palpita y
 * lanza ondas en ráfagas: entre más intenso, más grande el punto, más ondas y más rápido. Se carga de forma diferida.
 * Los textos del USGS van como nodos de texto (nunca como HTML).
 */
export default function QuakeMap({ quakes, origin, locale }: { quakes: Quake[]; origin: { latitude: number; longitude: number } | null; locale: string }) {
  const t = useT().quakes;
  const box = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(quakes.map((q) => [q.id, q.magnitude]));

  useEffect(() => {
    if (!box.current) return;
    const map = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([4.6, -74.1], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);
    const points: L.LatLngExpression[] = [];
    // Los pequeños primero: los fuertes quedan encima.
    [...quakes].sort((a, b) => a.magnitude - b.magnitude).forEach((q) => {
      const size = quakeDotSize(q.magnitude);
      const html = document.createElement('div');
      html.className = `quake-pin quake-pin--${quakeLevel(q.magnitude)}`;
      html.style.setProperty('--s', `${size}px`);
      html.style.setProperty('--d', `${quakePulseSeconds(q.magnitude)}s`);
      for (let i = 0; i < quakeWaves(q.magnitude); i++) {
        const wave = document.createElement('span');
        wave.className = 'quake-pin__wave';
        wave.style.animationDelay = `${i * 0.28}s`;
        html.appendChild(wave);
      }
      const dot = document.createElement('span');
      dot.className = 'quake-pin__dot';
      html.appendChild(dot);
      const icon = L.divIcon({ html, className: 'quake-pin-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const tip = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = t.magnitude(q.magnitude.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
      const place = document.createElement('div');
      place.textContent = q.place;
      const when = document.createElement('small');
      when.textContent = new Date(q.time).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) + t.depth(Math.round(q.depthKm));
      tip.append(strong, place, when);
      L.marker([q.latitude, q.longitude], { icon, keyboard: true, title: `${strong.textContent}, ${q.place}` }).bindPopup(tip).addTo(map);
      points.push([q.latitude, q.longitude]);
    });
    if (origin) {
      L.circleMarker([origin.latitude, origin.longitude], { radius: 7, className: 'real-map__pin' }).bindTooltip(t.you).addTo(map);
      points.push([origin.latitude, origin.longitude]);
    }
    const frame = () => {
      map.invalidateSize();
      if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 9 });
    };
    frame();
    const observer = new ResizeObserver(frame);
    observer.observe(box.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
    // `key` resume la lista de sismos para no reconstruir el mapa con cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, origin?.latitude, origin?.longitude, locale]);

  return <div ref={box} className="quake-map" role="region" aria-label={t.mapLabel} />;
}
