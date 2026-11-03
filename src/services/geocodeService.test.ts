// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeQuery, parseEsriCandidate, parseFeature, searchAddress } from './geocodeService';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const esriCandidate = (address: string, y: number, x: number, type = 'PointAddress', score = 97) => ({
  address, score, location: { x, y }, attributes: { Addr_type: type },
});
const feature = (props: Record<string, string>, lon: number, lat: number) => ({ properties: props, geometry: { coordinates: [lon, lat] } });

/** fetch simulado según el servicio consultado. */
function mockServices(esri: unknown, photon: unknown) {
  const fn = vi.fn(async (url: string) => {
    if (url.includes('arcgis')) return esri instanceof Response ? esri : ok(esri);
    return photon instanceof Response ? photon : ok(photon);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('normalizeQuery', () => {
  it('limpia paréntesis, «Barrio», «D.C.» y «Colombia»', () => {
    expect(normalizeQuery('Carrera 20 # 39-52 (Barrio La Soledad), Bogotá, D.C., Colombia', false)).toBe('Carrera 20 # 39-52 La Soledad, Bogotá');
  });
  it('para Photon convierte la nomenclatura', () => {
    expect(normalizeQuery('Carrera 20 # 39-52, Bogotá')).toBe('Carrera 20 39-52, Bogotá');
    expect(normalizeQuery('Cra. 20 No. 39-52')).toBe('Carrera 20 39-52');
    expect(normalizeQuery('Cl 26 #68-85')).toBe('Calle 26 68-85');
  });
  it('no toca nombres de lugares', () => {
    expect(normalizeQuery('Parque Simón Bolívar')).toBe('Parque Simón Bolívar');
  });
});

describe('parseEsriCandidate', () => {
  it('dirección exacta (PointAddress) con nombre corto', () => {
    expect(parseEsriCandidate(esriCandidate('Carrera 20 39 52, Bogotá, D.C., Distrito Capital', 4.62811, -74.07356))).toEqual({
      label: 'Carrera 20 39 52, Bogotá, D.C., Distrito Capital', shortLabel: 'Carrera 20 39 52', latitude: 4.62811, longitude: -74.07356, exact: true,
    });
  });
  it('calle o zona = aproximada; puntaje bajo o datos inválidos se descartan', () => {
    expect(parseEsriCandidate(esriCandidate('Carrera 20, Bogotá', 4.6, -74, 'StreetName'))?.exact).toBe(false);
    expect(parseEsriCandidate(esriCandidate('x', 4.6, -74, 'POI', 40))).toBeNull();
    expect(parseEsriCandidate(esriCandidate('x', 95, -74))).toBeNull();
  });
});

describe('parseFeature (Photon)', () => {
  it('arma etiqueta y nombre corto', () => {
    expect(parseFeature(feature({ street: 'Carrera 20', housenumber: '42-52', city: 'Bogotá', country: 'Colombia', countrycode: 'CO' }, -74.07, 4.63)))
      .toMatchObject({ label: 'Carrera 20 42-52, Bogotá, Colombia', shortLabel: 'Carrera 20 42-52', countrycode: 'CO', exact: false });
  });
  it('descarta coordenadas inválidas o sin texto', () => {
    expect(parseFeature({ properties: { name: 'x' }, geometry: { coordinates: [0, 95] } })).toBeNull();
    expect(parseFeature({ properties: {}, geometry: { coordinates: [-74, 4.6] } })).toBeNull();
  });
});

describe('searchAddress', () => {
  it('menos de 3 caracteres: no consulta', async () => {
    const fn = mockServices({}, {});
    expect(await searchAddress('ab')).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('Esri primero, luego Photon sin duplicar el mismo punto', async () => {
    vi.useFakeTimers();
    const fn = mockServices(
      { candidates: [esriCandidate('Carrera 20 39 52, Bogotá', 4.62811, -74.07356)] },
      { features: [
        feature({ name: 'Mismo punto', countrycode: 'CO' }, -74.07357, 4.62812),
        feature({ street: 'Carrera 20', housenumber: '42-52', city: 'Bogotá', countrycode: 'CO' }, -74.0727, 4.6324),
      ] },
    );
    const promise = searchAddress('Carrera 20 # 39-52', { latitude: 4.6123, longitude: -74.0711 });
    await vi.runAllTimersAsync();
    const r = await promise;
    expect(r.map((x) => x.label)).toEqual(['Carrera 20 39 52, Bogotá', 'Carrera 20 42-52, Bogotá']);
    expect(r[0].exact).toBe(true);
    const esriUrl = new URL(String((fn.mock.calls.find((c) => String(c[0]).includes('arcgis')) as unknown as [string])[0]));
    expect(esriUrl.searchParams.get('SingleLine')).toBe('Carrera 20 # 39-52');
    expect(esriUrl.searchParams.get('location')).toBe('-74.071,4.612');
    expect(esriUrl.searchParams.get('forStorage')).toBe('false');
  });

  it('si Esri falla se usan los resultados de Photon', async () => {
    vi.useFakeTimers();
    mockServices(new Response('', { status: 500 }), { features: [feature({ name: 'Parque', city: 'Bogotá', countrycode: 'CO' }, -74.09, 4.66)] });
    const promise = searchAddress('Parque Simón Bolívar');
    await vi.runAllTimersAsync();
    expect((await promise).map((x) => x.label)).toEqual(['Parque, Bogotá']);
  });

  it('si fallan las dos fuentes, propaga el error', async () => {
    vi.useFakeTimers();
    mockServices(new Response('', { status: 503 }), new Response('', { status: 503 }));
    const promise = searchAddress('Bogotá centro');
    const assertion = expect(promise).rejects.toThrow('HTTP 503');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
