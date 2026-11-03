// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRoute, formatDistance, formatDuration, googleMapsUrl, parseRoute, routeUrl, wazeUrl } from './routeService';

const from = { latitude: 4.6281, longitude: -74.0736 };
const to = { latitude: 4.6324, longitude: -74.0727 };

afterEach(() => vi.unstubAllGlobals());

describe('routeUrl y googleMapsUrl', () => {
  it('perfil por modo y coordenadas lon,lat', () => {
    expect(routeUrl('foot', from, to)).toBe(
      'https://routing.openstreetmap.de/routed-foot/route/v1/driving/-74.073600,4.628100;-74.072700,4.632400?overview=full&geometries=geojson',
    );
    expect(routeUrl('car', from, to)).toContain('/routed-car/');
    expect(routeUrl('bike', from, to)).toContain('/routed-bike/');
  });
  it('Google Maps con origen, destino y modo', () => {
    const url = new URL(googleMapsUrl('car', from, to));
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('origin')).toBe('4.6281,-74.0736');
    expect(url.searchParams.get('destination')).toBe('4.6324,-74.0727');
    expect(url.searchParams.get('travelmode')).toBe('driving');
    expect(new URL(googleMapsUrl('foot', from, to)).searchParams.get('travelmode')).toBe('walking');
  });
});

describe('wazeUrl', () => {
  it('app del celular: navega al destino desde el GPS', () => {
    expect(wazeUrl(to, from, true)).toBe('https://waze.com/ul?ll=4.6324,-74.0727&navigate=yes');
  });
  it('navegador: mapa web con salida y destino', () => {
    const url = new URL(wazeUrl(to, from, false));
    expect(url.origin + url.pathname).toBe('https://www.waze.com/live-map/directions');
    expect(url.searchParams.get('from')).toBe('ll.4.6281,-74.0736');
    expect(url.searchParams.get('to')).toBe('ll.4.6324,-74.0727');
  });
});

describe('parseRoute', () => {
  it('convierte el trazado a [lat, lng]', () => {
    const r = parseRoute({ code: 'Ok', routes: [{ distance: 519, duration: 420, geometry: { coordinates: [[-74.0736, 4.6281], [-74.0727, 4.6324]] } }] });
    expect(r).toEqual({ distance: 519, duration: 420, path: [[4.6281, -74.0736], [4.6324, -74.0727]] });
  });
  it('sin ruta o datos mal formados: null', () => {
    expect(parseRoute({ code: 'NoRoute', routes: [] })).toBeNull();
    expect(parseRoute({ code: 'Ok', routes: [{ distance: 1, duration: 1, geometry: { coordinates: [[1, 'x']] } }] })).toBeNull();
    expect(parseRoute(null)).toBeNull();
  });
});

describe('fetchRoute', () => {
  it('propaga el error HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(fetchRoute('foot', from, to)).rejects.toThrow('HTTP 503');
  });
});

describe('formato', () => {
  it('distancia y duración', () => {
    expect(formatDistance(519)).toBe('519 m');
    expect(formatDistance(8100)).toBe('8.1 km');
    expect(formatDuration(420)).toBe('7 min');
    expect(formatDuration(20)).toBe('1 min');
    expect(formatDuration(5400)).toBe('1 h 30 min');
  });
});
