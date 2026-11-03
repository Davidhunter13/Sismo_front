// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { getLang } from '../i18n';

/**
 * Búsqueda de direcciones y lugares para el punto de encuentro, gratis y sin llave.
 *
 * 1. Esri ArcGIS World Geocoding (principal): entiende la nomenclatura colombiana («Carrera 20 # 39-52») y
 *    tiene números de casa en las ciudades de Colombia; también algunos lugares por nombre.
 * 2. Photon (komoot, datos de OpenStreetMap), en paralelo como respaldo y para lugares por nombre.
 * Se descartaron Nominatim (no encuentra direcciones colombianas) y Overpass (bloquea consultas, poco fiable).
 *
 * Uso: solo al pulsar «Buscar» y como máximo una consulta por segundo.
 * Licencia: Esri permite búsquedas anónimas sin almacenar resultados; guardar el punto como punto de encuentro
 * es un almacenamiento. Para producción, revisar sus términos o usar una cuenta ArcGIS Location Platform.
 * Privacidad: se envían el texto buscado y una coordenada aproximada de referencia (para ordenar resultados).
 */
export interface AddressResult {
  label: string;
  /** Nombre corto (para usar como nombre del punto de encuentro). */
  shortLabel: string;
  latitude: number;
  longitude: number;
  /** true si la fuente indica la dirección exacta (número de casa); false = calle, barrio o aproximación. */
  exact?: boolean;
}

const ESRI = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
const PHOTON = 'https://photon.komoot.io/api/';
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 10_000;
const MAX_QUERY = 200;
/** Puntaje mínimo de Esri (0–100) para mostrar un candidato. */
const MIN_SCORE = 70;
/** Referencia por defecto (Bogotá) cuando no hay ubicación del usuario. */
const DEFAULT_NEAR = { latitude: 4.65, longitude: -74.1 };
let lastCall = 0;

type Near = { latitude: number; longitude: number } | null;

/**
 * Limpia el texto: «(Barrio La Soledad)» → «La Soledad», quita «D.C.» y «Colombia». Para Photon además
 * convierte la nomenclatura («Carrera 20 # 39-52», «Cra. 20 No. 39-52» → «Carrera 20 39-52»).
 */
export function normalizeQuery(query: string, forPhoton = true): string {
  let q = query
    .replace(/[()]/g, ' ')
    .replace(/\bBarrio\b/gi, ' ')
    .replace(/\bD\.?\s?C\.?(?=[\s,]|$)/g, ' ')
    .replace(/,?\s*\bColombia\b\.?/gi, ' ');
  if (forPhoton) {
    q = q
      .replace(/#|\bN[oº°]\.?(?=\s*\d)/gi, ' ')
      .replace(/\bCra\.?(?=\s)/gi, 'Carrera')
      .replace(/\bCl\.?(?=\s)/gi, 'Calle')
      .replace(/\bAv\.?(?=\s)/gi, 'Avenida');
  }
  return q
    .replace(/\s*,\s*(,\s*)+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .slice(0, MAX_QUERY);
}

const finite = (lat: number, lon: number) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

/** Valida un candidato de Esri. */
export function parseEsriCandidate(c: unknown): AddressResult | null {
  const o = c as { address?: unknown; score?: unknown; location?: { x?: unknown; y?: unknown }; attributes?: { Addr_type?: unknown } };
  const label = str(o?.address).slice(0, 300);
  const latitude = Number(o?.location?.y);
  const longitude = Number(o?.location?.x);
  if (!label || !finite(latitude, longitude) || Number(o?.score) < MIN_SCORE) return null;
  const type = str(o?.attributes?.Addr_type);
  return {
    label,
    shortLabel: label.split(',')[0].trim().slice(0, 40),
    latitude,
    longitude,
    exact: type === 'PointAddress' || type === 'Subaddress' || type === 'POI',
  };
}

interface PhotonProps {
  name?: unknown;
  street?: unknown;
  housenumber?: unknown;
  city?: unknown;
  district?: unknown;
  state?: unknown;
  country?: unknown;
  countrycode?: unknown;
}

/** Valida un resultado de Photon. */
export function parseFeature(f: unknown): (AddressResult & { countrycode: string }) | null {
  const feat = f as { properties?: PhotonProps; geometry?: { coordinates?: unknown } };
  const c = feat?.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const [longitude, latitude] = c.map(Number);
  if (!finite(latitude, longitude)) return null;
  const p = feat.properties ?? {};
  const street = [str(p.street), str(p.housenumber)].filter(Boolean).join(' ');
  const name = str(p.name);
  const place = str(p.city) || str(p.district) || str(p.state);
  const parts = [name, street && street !== name ? street : '', place, str(p.country)].filter(Boolean);
  if (parts.length === 0) return null;
  const label = parts.join(', ').slice(0, 300);
  const shortLabel = (name || street || place).slice(0, 40);
  return { label, shortLabel, latitude, longitude, exact: false, countrycode: str(p.countrycode).toUpperCase() };
}

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function esri(query: string, ref: { latitude: number; longitude: number }): Promise<AddressResult[]> {
  const params = new URLSearchParams({
    SingleLine: query,
    f: 'json',
    maxLocations: '5',
    outFields: 'Addr_type',
    location: `${ref.longitude.toFixed(3)},${ref.latitude.toFixed(3)}`,
    langCode: getLang() === 'en' ? 'EN' : 'ES',
    forStorage: 'false',
  });
  const json = (await getJson(`${ESRI}?${params}`)) as { candidates?: unknown[]; error?: unknown };
  if (json.error) throw new Error('Esri error');
  const found = (Array.isArray(json.candidates) ? json.candidates : []).map(parseEsriCandidate).filter((r): r is AddressResult => r !== null);
  // Exactas primero y, dentro de cada grupo, las más cercanas a la referencia (p. ej. un lugar en Bogotá
  // antes que uno con nombre parecido en otra ciudad). La distancia en grados basta para ordenar.
  const dist = (r: AddressResult) => (r.latitude - ref.latitude) ** 2 + (r.longitude - ref.longitude) ** 2;
  return [...found.filter((r) => r.exact).sort((x, y) => dist(x) - dist(y)), ...found.filter((r) => !r.exact)];
}

async function photon(query: string, ref: { latitude: number; longitude: number }): Promise<AddressResult[]> {
  const params = new URLSearchParams({ q: query, limit: '8', lat: ref.latitude.toFixed(3), lon: ref.longitude.toFixed(3) });
  if (getLang() === 'en') params.set('lang', 'en');
  const json = (await getJson(`${PHOTON}?${params}`)) as { features?: unknown[] };
  const parsed = (Array.isArray(json.features) ? json.features : [])
    .map(parseFeature)
    .filter((r): r is AddressResult & { countrycode: string } => r !== null);
  // Colombia primero (dentro de cada grupo se respeta la cercanía que da Photon).
  return [...parsed.filter((r) => r.countrycode === 'CO'), ...parsed.filter((r) => r.countrycode !== 'CO')].map((r) => ({
    label: r.label,
    shortLabel: r.shortLabel,
    latitude: r.latitude,
    longitude: r.longitude,
    exact: r.exact,
  }));
}

const close = (a: AddressResult, b: AddressResult) => Math.abs(a.latitude - b.latitude) < 0.0003 && Math.abs(a.longitude - b.longitude) < 0.0003;

/**
 * Busca una dirección o lugar (hasta 6 resultados): primero Esri, luego Photon sin duplicados.
 * Lanza error solo si las dos fuentes fallan (sin conexión).
 */
export async function searchAddress(query: string, near: Near = null): Promise<AddressResult[]> {
  const esriQuery = normalizeQuery(query, false);
  const photonQuery = normalizeQuery(query, true);
  if (photonQuery.length < 3) return [];

  // Uso responsable: como máximo una búsqueda por segundo.
  const waitMs = lastCall + MIN_INTERVAL_MS - Date.now();
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  lastCall = Date.now();

  const ref = near ?? DEFAULT_NEAR;
  const [a, b] = await Promise.allSettled([esri(esriQuery, ref), photon(photonQuery, ref)]);
  if (a.status === 'rejected' && b.status === 'rejected') throw b.reason;
  const primary = a.status === 'fulfilled' ? a.value : [];
  const secondary = (b.status === 'fulfilled' ? b.value : []).filter((p) => !primary.some((e) => close(e, p)));
  return [...primary, ...secondary].slice(0, 6);
}
