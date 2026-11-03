// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.

/**
 * Ruta hasta el punto de encuentro con el servicio público de OpenStreetMap (routing.openstreetmap.de,
 * motor OSRM de FOSSGIS): gratuito y sin llave, perfiles a pie, carro y bicicleta (para moto se usa carro).
 * Uso responsable: una consulta por cambio de modo/ubicación, sin consultas periódicas. Requiere internet.
 * Para la guía paso a paso por voz se ofrece abrir la ruta en Google Maps (enlace público, sin llave).
 */
export type TravelMode = 'foot' | 'car' | 'bike';

export interface RouteResult {
  /** Metros. */
  distance: number;
  /** Segundos. */
  duration: number;
  /** Trazado [latitud, longitud]. */
  path: [number, number][];
}

interface LatLng {
  latitude: number;
  longitude: number;
}

const BASE = 'https://routing.openstreetmap.de';
const PROFILE: Record<TravelMode, string> = { foot: 'routed-foot', car: 'routed-car', bike: 'routed-bike' };
const GOOGLE_MODE: Record<TravelMode, string> = { foot: 'walking', car: 'driving', bike: 'bicycling' };
const TIMEOUT_MS = 12_000;

const coord = (p: LatLng) => `${p.longitude.toFixed(6)},${p.latitude.toFixed(6)}`;

export function routeUrl(mode: TravelMode, from: LatLng, to: LatLng): string {
  return `${BASE}/${PROFILE[mode]}/route/v1/driving/${coord(from)};${coord(to)}?overview=full&geometries=geojson`;
}

/** Valida la respuesta OSRM antes de usarla. Devuelve null si no hay una ruta utilizable. */
export function parseRoute(json: unknown): RouteResult | null {
  const j = json as { code?: unknown; routes?: { distance?: unknown; duration?: unknown; geometry?: { coordinates?: unknown } }[] };
  const r = j?.code === 'Ok' && Array.isArray(j.routes) ? j.routes[0] : undefined;
  if (!r || typeof r.distance !== 'number' || typeof r.duration !== 'number') return null;
  const coords = Array.isArray(r.geometry?.coordinates) ? (r.geometry?.coordinates as unknown[]) : [];
  const path = coords
    .filter((c): c is [number, number] => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map(([lon, lat]) => [lat, lon] as [number, number]);
  return path.length >= 2 ? { distance: r.distance, duration: r.duration, path } : null;
}

/** Calcula la ruta. Lanza error si no hay conexión o el servicio falla; null si no existe una ruta. */
export async function fetchRoute(mode: TravelMode, from: LatLng, to: LatLng): Promise<RouteResult | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(routeUrl(mode, from, to), { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseRoute(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

/** Enlace a Google Maps con la ruta lista (abre la app si está instalada). */
export function googleMapsUrl(mode: TravelMode, from: LatLng, to: LatLng): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `${from.latitude},${from.longitude}`,
    destination: `${to.latitude},${to.longitude}`,
    travelmode: GOOGLE_MODE[mode],
  });
  return `https://www.google.com/maps/dir/?${params}`;
}

/**
 * Enlace a Waze (gratis, sin llave). Waze solo navega en vehículo: se ofrece en el modo carro/moto.
 * - App (celular): `waze.com/ul` abre la app y navega al destino desde el GPS actual (salida más exacta).
 * - Navegador (PC): el mapa web de Waze no conoce la ubicación del usuario, así que se usa `live-map`,
 *   que acepta salida y destino en el enlace.
 */
export function wazeUrl(to: LatLng, from: LatLng | null, app: boolean): string {
  if (app || !from) return `https://waze.com/ul?ll=${to.latitude},${to.longitude}&navigate=yes`;
  const ll = (p: LatLng) => `ll.${p.latitude},${p.longitude}`;
  return `https://www.waze.com/live-map/directions?${new URLSearchParams({ from: ll(from), to: ll(to) })}`;
}

export const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

export function formatDuration(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}
