// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { distanceKm, fetchNearbyQuakes } from './quakeService';

const feature = (id: string, lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  id,
  properties: { mag: 4.5, place: id, time: 1_000, url: 'https://earthquake.usgs.gov/x', ...extra },
  geometry: { coordinates: [lng, lat, 10] },
});

const mockFeed = (features: unknown[]) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ features }), { status: 200 })));

afterEach(() => vi.unstubAllGlobals());

describe('distanceKm', () => {
  it('Bogotá – Medellín ≈ 240 km', () => {
    expect(distanceKm(4.711, -74.0721, 6.2442, -75.5812)).toBeGreaterThan(230);
    expect(distanceKm(4.711, -74.0721, 6.2442, -75.5812)).toBeLessThan(250);
  });
  it('distancia cero al mismo punto', () => {
    expect(distanceKm(4.6, -74, 4.6, -74)).toBe(0);
  });
});

describe('fetchNearbyQuakes', () => {
  it('con ubicación: filtra por radio, ordena por fecha y calcula distancia', async () => {
    mockFeed([
      feature('cerca-viejo', 4.8, -74.1, { time: 1 }),
      feature('cerca-nuevo', 5.0, -74.0, { time: 2 }),
      feature('lejos', 35.6, 139.7),
    ]);
    const quakes = await fetchNearbyQuakes('day', { latitude: 4.65, longitude: -74.1 });
    expect(quakes.map((q) => q.id)).toEqual(['cerca-nuevo', 'cerca-viejo']);
    expect(quakes[0].distanceKm).toBeGreaterThan(0);
  });

  it('sin ubicación: solo sismos dentro de Colombia', async () => {
    mockFeed([feature('bucaramanga', 7.1, -73.1), feature('lima', -12.0, -77.0)]);
    const quakes = await fetchNearbyQuakes('week', null);
    expect(quakes.map((q) => q.id)).toEqual(['bucaramanga']);
  });

  it('descarta elementos mal formados y enlaces fuera del USGS', async () => {
    mockFeed([
      { id: 'sin-geometria', properties: { mag: 3, time: 1 } },
      feature('sin-magnitud', 4.7, -74.1, { mag: 'x' }),
      feature('enlace-raro', 4.7, -74.1, { url: 'javascript:alert(1)' }),
    ]);
    const quakes = await fetchNearbyQuakes('day', { latitude: 4.65, longitude: -74.1 });
    expect(quakes).toHaveLength(1);
    expect(quakes[0].url).toBe('');
  });

  it('propaga el error HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(fetchNearbyQuakes('day', null)).rejects.toThrow('HTTP 503');
  });
});
