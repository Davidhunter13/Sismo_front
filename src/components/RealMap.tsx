// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { LocationSnapshot, MeetingPoint } from '../types';
import { formatCoord } from '../utils/format';

/**
 * Mapa real con teselas de OpenStreetMap (Leaflet). Al mostrarse, el dispositivo descarga las teselas
 * de la zona desde los servidores de OpenStreetMap: eso revela la zona aproximada, no las coordenadas exactas.
 * Se carga de forma diferida para no pesar en el resto de la app.
 */
/** Por encima de este margen (m) la posición se considera aproximada (típico en PC: WiFi/IP, sin GPS). */
const LOW_ACCURACY_M = 100;

interface RealMapProps {
  snapshot: LocationSnapshot;
  meetingPoint?: MeetingPoint | null;
  /** Si se indica, tocar el mapa elige un punto (p. ej. el punto de encuentro). */
  onPick?: (latitude: number, longitude: number) => void;
}

export default function RealMap({ snapshot, meetingPoint, onPick }: RealMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const isTest = snapshot.source === 'prueba';
  const lowAccuracy = !isTest && snapshot.accuracy != null && snapshot.accuracy > LOW_ACCURACY_M;

  useEffect(() => {
    if (!container.current) return;
    const center: L.LatLngExpression = [snapshot.latitude, snapshot.longitude];
    const map = L.map(container.current, { zoomControl: true, attributionControl: true }).setView(center, 16);
    mapRef.current = map;
    map.on('click', (e: L.LeafletMouseEvent) => onPickRef.current?.(e.latlng.lat, e.latlng.lng));
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    if (snapshot.accuracy != null) {
      const circle = L.circle(center, { radius: snapshot.accuracy, className: 'real-map__accuracy' }).addTo(map);
      // Si la precisión es baja, el encuadre muestra todo el círculo: la posición real puede estar en cualquier punto de él.
      if (snapshot.accuracy > LOW_ACCURACY_M) map.fitBounds(circle.getBounds(), { padding: [12, 12] });
    }
    L.circleMarker(center, { radius: 9, className: isTest ? 'real-map__pin real-map__pin--test' : 'real-map__pin' }).addTo(map);

    // Ionic anima la entrada de la vista: recalcula el tamaño cuando el contenedor ya es visible.
    const t = window.setTimeout(() => map.invalidateSize(), 200);
    return () => {
      window.clearTimeout(t);
      mapRef.current = null;
      map.remove();
    };
  }, [snapshot.latitude, snapshot.longitude, snapshot.accuracy, isTest]);

  // Punto de encuentro en una capa aparte: cambiarlo no reconstruye el mapa.
  const mpLat = meetingPoint?.latitude;
  const mpLng = meetingPoint?.longitude;
  const mpLabel = meetingPoint?.label;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mpLat == null || mpLng == null) return;
    // Leaflet interpreta los textos como HTML: el nombre lo escribe el usuario, así que va como nodo de texto.
    const tooltip = document.createElement('span');
    tooltip.textContent = `Punto de encuentro: ${mpLabel ?? ''}`;
    const marker = L.circleMarker([mpLat, mpLng], { radius: 9, className: 'real-map__meeting' })
      .bindTooltip(tooltip)
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [mpLat, mpLng, mpLabel, snapshot.latitude, snapshot.longitude, snapshot.accuracy, isTest]);

  return (
    <figure className="real-map" aria-label="Mapa real de la ubicación">
      <div ref={container} className={`real-map__canvas${onPick ? ' real-map__canvas--pick' : ''}`} />
      <figcaption>
        {`${isTest ? 'Prueba · ' : ''}${formatCoord(snapshot.latitude)}, ${formatCoord(snapshot.longitude)}`}
        {snapshot.accuracy != null && <span> · Precisión ±{Math.round(snapshot.accuracy)} m</span>}
      </figcaption>
      {lowAccuracy && (
        <p className="callout callout--warning small real-map__warning">
          Ubicación aproximada: este dispositivo no usó GPS (en computadores se estima por WiFi o IP).
          La posición real puede estar en cualquier punto del círculo. En el celular será más precisa.
        </p>
      )}
    </figure>
  );
}
