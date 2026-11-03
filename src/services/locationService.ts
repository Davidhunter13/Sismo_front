// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { getT } from '../i18n';
import type { LocationPermission, LocationSnapshot } from '../types';

export interface LocationResult {
  permission: LocationPermission;
  snapshot: LocationSnapshot | null;
  message: string;
}

function isGeolocationAvailable(): boolean {
  return Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && 'geolocation' in navigator);
}

/** Consulta el permiso sin abrir el diálogo del sistema. */
export async function checkLocationPermission(): Promise<LocationPermission> {
  if (!isGeolocationAvailable()) return 'no_disponible';
  try {
    const { location } = await Geolocation.checkPermissions();
    if (location === 'granted') return 'concedido';
    if (location === 'denied') return 'denegado';
    return 'sin_solicitar';
  } catch {
    return 'sin_solicitar';
  }
}

/** En la app nativa muestra el diálogo de permiso del sistema al iniciar (sin leer la posición). En web no hace nada. */
export async function requestLocationPermissionOnNative(): Promise<LocationPermission | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { location } = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    if (location === 'granted') return 'concedido';
    if (location === 'denied') return 'denegado';
    return 'sin_solicitar';
  } catch {
    // Servicios de ubicación apagados en el teléfono.
    return 'no_disponible';
  }
}

/** Solicita la posición real del dispositivo. Nunca devuelve coordenadas inventadas. */
export async function requestDeviceLocation(): Promise<LocationResult> {
  const t = getT().services.location;
  if (!isGeolocationAvailable()) {
    return { permission: 'no_disponible', snapshot: null, message: t.unavailable };
  }
  if (!Capacitor.isNativePlatform() && !window.isSecureContext) {
    return { permission: 'no_disponible', snapshot: null, message: t.insecure };
  }
  try {
    const pos = await bestPosition();
    const precise = pos.coords.accuracy <= GOOD_ACCURACY_M;
    return {
      permission: 'concedido',
      snapshot: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date(pos.timestamp).toISOString(),
        source: 'dispositivo',
      },
      message: precise
        ? t.obtained
        : t.approximate(Math.round(pos.coords.accuracy)),
    };
  } catch (err) {
    const code = (err as { code?: number }).code;
    const text = String((err as { message?: string }).message ?? '').toLowerCase();
    if (code === 1 || text.includes('denied')) {
      return { permission: 'denegado', snapshot: null, message: t.denied };
    }
    return { permission: 'no_disponible', snapshot: null, message: t.failed };
  }
}

/** Precisión con la que se deja de esperar (m). */
const GOOD_ACCURACY_M = 25;
/** Tiempo máximo esperando a que el GPS afine (ms). */
const REFINE_MS = 10_000;

/**
 * Escucha la posición hasta REFINE_MS y devuelve la lectura más precisa: la primera suele venir
 * de la red (WiFi/antenas) y el GPS la afina después. Termina antes si alcanza GOOD_ACCURACY_M.
 * Rechaza con el error del sistema si no llega ninguna lectura (p. ej. permiso denegado).
 */
async function bestPosition(): Promise<Position> {
  let best: Position | null = null;
  let watchId: string | null = null;
  let finish: () => void = () => {};
  let fail: (err: unknown) => void = () => {};

  const done = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  const timer = window.setTimeout(finish, REFINE_MS);

  try {
    watchId = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: REFINE_MS, maximumAge: 0 }, (pos, err) => {
      if (pos) {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= GOOD_ACCURACY_M) finish();
      } else if (err && !best && isDenied(err)) {
        // Solo el permiso denegado corta la espera; un tiempo agotado se resuelve con la respaldo de abajo.
        fail(err);
      }
    });
    await done;
  } finally {
    window.clearTimeout(timer);
    if (watchId) await Geolocation.clearWatch({ id: watchId });
  }
  if (best) return best;
  // Sin GPS (p. ej. un computador) la alta precisión nunca llega: se pide una ubicación aproximada
  // por WiFi o red, que responde rápido. Se acepta una lectura reciente de hasta 5 minutos.
  return Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: FALLBACK_MS, maximumAge: 5 * 60_000 });
}

/** Tiempo máximo de la ubicación aproximada de respaldo (ms). */
const FALLBACK_MS = 15_000;

function isDenied(err: unknown): boolean {
  const code = (err as { code?: number }).code;
  const text = String((err as { message?: string }).message ?? '').toLowerCase();
  return code === 1 || text.includes('denied');
}
