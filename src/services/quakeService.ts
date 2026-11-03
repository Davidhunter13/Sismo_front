// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getT } from '../i18n';

/**
 * Sismos recientes desde el catálogo público del USGS (gratuito, sin llave, permite CORS).
 * https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 * No se envía la ubicación del usuario: se descarga el listado mundial y se filtra en el dispositivo.
 */
export type QuakePeriod = 'day' | 'week';

export interface Quake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depthKm: number;
  url: string;
  distanceKm?: number;
}

const FEEDS: Record<QuakePeriod, string> = {
  day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
  week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
};

/** Recuadro aproximado de Colombia, usado cuando no hay ubicación del usuario. */
const COLOMBIA = { minLat: -4.3, maxLat: 13.5, minLng: -79.1, maxLng: -66.8 };
export const NEARBY_RADIUS_KM = 500;
const TIMEOUT_MS = 12_000;

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Valida cada elemento del GeoJSON: los datos externos no se usan sin comprobar su forma. */
function parseFeature(f: unknown): Quake | null {
  const feat = f as { id?: unknown; properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };
  const p = feat?.properties;
  const c = feat?.geometry?.coordinates;
  if (typeof feat?.id !== 'string' || !p || !Array.isArray(c) || c.length < 3) return null;
  const [lng, lat, depth] = c;
  if (typeof p.mag !== 'number' || typeof p.time !== 'number' || typeof lat !== 'number' || typeof lng !== 'number') return null;
  const url = typeof p.url === 'string' && p.url.startsWith('https://earthquake.usgs.gov/') ? p.url : '';
  return {
    id: feat.id,
    magnitude: p.mag,
    place: typeof p.place === 'string' ? p.place : getT().services.quakes.unknownPlace,
    time: p.time,
    latitude: lat,
    longitude: lng,
    depthKm: typeof depth === 'number' ? depth : 0,
    url,
  };
}

/**
 * Sismos cercanos: dentro de NEARBY_RADIUS_KM de `origin`, o dentro de Colombia si no hay ubicación.
 * Ordenados del más reciente al más antiguo.
 */
export async function fetchNearbyQuakes(period: QuakePeriod, origin: { latitude: number; longitude: number } | null): Promise<Quake[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(FEEDS[period], { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { features?: unknown[] };
    const quakes = (Array.isArray(json.features) ? json.features : []).map(parseFeature).filter((q): q is Quake => q !== null);
    const nearby = origin
      ? quakes
          .map((q) => ({ ...q, distanceKm: distanceKm(origin.latitude, origin.longitude, q.latitude, q.longitude) }))
          .filter((q) => q.distanceKm <= NEARBY_RADIUS_KM)
      : quakes.filter(
          (q) => q.latitude >= COLOMBIA.minLat && q.latitude <= COLOMBIA.maxLat && q.longitude >= COLOMBIA.minLng && q.longitude <= COLOMBIA.maxLng,
        );
    return nearby.sort((a, b) => b.time - a.time);
  } finally {
    clearTimeout(timer);
  }
}
