// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __setPhotoDepsForTests, currentPhotoUrl, deletePhoto, fitWithin, flushPendingPhoto, getPhoto, hasPhoto, isExpired, MAX_FILE_BYTES, pendingPhoto,
  takeRejectedPhoto, uploadPhoto, validatePhotoFile,
} from './photoService';

describe('URL firmada de la foto', () => {
  let store: Record<string, string>;
  let now: number;

  beforeEach(() => {
    store = {};
    now = new Date('2026-11-05T15:00:00Z').getTime();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    __setPhotoDepsForTests({ base: () => 'https://api.test/sismo', token: () => 'tok', register: async () => undefined, online: () => true, now: () => now });
  });

  afterEach(() => {
    __setPhotoDepsForTests(null);
    vi.unstubAllGlobals();
  });

  const signed = (n: number, minutes: number) => ({ foto: { url: `https://bucket.test/f.jpg?sig=${n}`, expira: new Date(now + minutes * 60_000).toISOString() } });

  it('reutiliza la URL mientras está vigente y pide una nueva cuando vence', async () => {
    let n = 0;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(signed(++n, 15)), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    expect((await getPhoto())?.url).toContain('sig=1');
    now += 5 * 60_000;
    expect((await getPhoto())?.url).toContain('sig=1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A menos de un minuto de vencer (o vencida) se pide otra.
    now += 9.5 * 60_000;
    expect((await getPhoto())?.url).toContain('sig=2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(currentPhotoUrl()).toContain('sig=2');
    // Nunca se guarda la URL en el teléfono: solo si hay foto.
    expect(Object.values(store).join()).not.toContain('bucket.test');
    expect(hasPhoto()).toBe(true);
  });

  it('`force` la pide aunque parezca vigente (la imagen falló al cargar)', async () => {
    let n = 0;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(signed(++n, 15)), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getPhoto();
    expect((await getPhoto(true))?.url).toContain('sig=2');
  });

  it('isExpired con margen y fechas ilegibles', () => {
    expect(isExpired({ url: 'u', expira: new Date(now + 120_000).toISOString() }, now)).toBe(false);
    expect(isExpired({ url: 'u', expira: new Date(now + 30_000).toISOString() }, now)).toBe(true);
    expect(isExpired({ url: 'u', expira: 'no-es-fecha' }, now)).toBe(true);
  });

  it('subir y quitar actualizan «tiene foto»; los errores del servidor se traducen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(signed(1, 15)), { status: 200 })));
    expect((await uploadPhoto('data:image/jpeg;base64,AAAA')).ok).toBe(true);
    expect(hasPhoto()).toBe(true);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"foto":null}', { status: 200 })));
    expect((await deletePhoto()).ok).toBe(true);
    expect(hasPhoto()).toBe(false);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 413 })));
    expect(await uploadPhoto('data:image/jpeg;base64,AAAA')).toEqual({ ok: false, error: 'muy_grande' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"dato_invalido"}', { status: 422 })));
    expect(await uploadPhoto('data:image/jpeg;base64,AAAA')).toEqual({ ok: false, error: 'invalida' });
  });

});

describe('foto pendiente (sin conexión)', () => {
  let store: Record<string, string>;
  let now: number;
  let online: boolean;
  const JPEG = 'data:image/jpeg;base64,PENDIENTE';
  const signed = () => ({ foto: { url: 'https://bucket.test/f.jpg?sig=1', expira: new Date(now + 15 * 60_000).toISOString() } });

  beforeEach(() => {
    store = {};
    now = new Date('2026-11-05T15:00:00Z').getTime();
    online = false;
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    __setPhotoDepsForTests({ base: () => 'https://api.test/sismo', token: () => 'tok', register: async () => undefined, online: () => online, now: () => now });
  });

  afterEach(() => {
    __setPhotoDepsForTests(null);
    vi.unstubAllGlobals();
  });

  it('sin red queda pendiente, se ve y cuenta como foto; al volver la red se sube y se limpia', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(signed()), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await uploadPhoto(JPEG)).toEqual({ ok: true, photo: null, pending: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pendingPhoto()).toMatchObject({ op: 'upload', dataUrl: JPEG });
    expect(JSON.parse(store['sismo:v1:foto_pendiente']).dataUrl).toBe(JPEG);
    expect(currentPhotoUrl()).toBe(JPEG);
    expect(hasPhoto()).toBe(true);

    online = true;
    await flushPendingPhoto();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ imagen: JPEG });
    expect(pendingPhoto()).toBeNull();
    expect(store['sismo:v1:foto_pendiente']).toBeUndefined();
    expect(currentPhotoUrl()).toContain('sig=1');
    expect(hasPhoto()).toBe(true);
  });

  it('con red pero el servidor falla (red, 5xx, 503 bucket) también queda pendiente; 422 no', async () => {
    online = true;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"bucket_no_disponible"}', { status: 503 })));
    expect(await uploadPhoto(JPEG)).toMatchObject({ ok: true, pending: true });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('red'); }));
    expect(await uploadPhoto(JPEG)).toMatchObject({ ok: true, pending: true });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    expect(await uploadPhoto(JPEG)).toMatchObject({ ok: true, pending: true });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"dato_invalido","campo":"imagen"}', { status: 422 })));
    expect(await uploadPhoto('data:image/jpeg;base64,OTRA')).toEqual({ ok: false, error: 'invalida' });
    // La pendiente anterior sigue (solo se guarda la última intención que se pudo encolar).
    expect(pendingPhoto()).toMatchObject({ op: 'upload', dataUrl: JPEG });
  });

  it('«Quitar foto» descarta la pendiente; si el servidor tenía foto, queda pendiente quitarla (la última gana)', async () => {
    // El servidor ya tiene una foto.
    online = true;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(signed()), { status: 200 })));
    await uploadPhoto('data:image/jpeg;base64,VIEJA');
    online = false;
    await uploadPhoto(JPEG);
    expect(pendingPhoto()?.op).toBe('upload');

    expect(await deletePhoto()).toEqual({ ok: true, photo: null, pending: true });
    expect(pendingPhoto()?.op).toBe('delete');
    expect(hasPhoto()).toBe(false);
    expect(currentPhotoUrl()).toBeNull();

    online = true;
    const fetchMock = vi.fn(async () => new Response('{"foto":null}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await flushPendingPhoto();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).method).toBe('DELETE');
    expect(pendingPhoto()).toBeNull();
    expect(hasPhoto()).toBe(false);
  });

  it('«Quitar foto» sin foto en el servidor solo descarta la pendiente (no hay nada que borrar)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await uploadPhoto(JPEG);
    expect(await deletePhoto()).toEqual({ ok: true, photo: null });
    expect(pendingPhoto()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza la pendiente (422) se descarta y se avisa una sola vez', async () => {
    await uploadPhoto(JPEG);
    online = true;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"dato_invalido","campo":"imagen"}', { status: 422 })));
    await flushPendingPhoto();
    expect(pendingPhoto()).toBeNull();
    expect(takeRejectedPhoto()).toBe(true);
    expect(takeRejectedPhoto()).toBe(false);
  });

  it('si el teléfono no tiene espacio para guardarla, la pendiente sigue en memoria', async () => {
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        if (k === 'sismo:v1:foto_pendiente') throw new DOMException('lleno', 'QuotaExceededError');
        store[k] = v;
      },
      removeItem: (k: string) => { delete store[k]; },
    });
    expect(await uploadPhoto(JPEG)).toMatchObject({ ok: true, pending: true });
    expect(currentPhotoUrl()).toBe(JPEG);
  });
});

describe('validación y reducción', () => {
  it('solo imágenes de hasta 8 MB', () => {
    expect(validatePhotoFile({ type: 'image/png', size: 1000 })).toBe('ok');
    expect(validatePhotoFile({ type: 'application/pdf', size: 1000 })).toBe('tipo');
    expect(validatePhotoFile({ type: '', size: 1000 })).toBe('tipo');
    expect(validatePhotoFile({ type: 'image/jpeg', size: MAX_FILE_BYTES + 1 })).toBe('tamano');
  });

  it('el lado mayor queda en 512 px sin agrandar las pequeñas', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 512, height: 384 });
    expect(fitWithin(1000, 2000)).toEqual({ width: 256, height: 512 });
    expect(fitWithin(300, 200)).toEqual({ width: 300, height: 200 });
  });
});
