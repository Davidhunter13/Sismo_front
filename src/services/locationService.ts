// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
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
  if (!isGeolocationAvailable()) {
    return { permission: 'no_disponible', snapshot: null, message: 'Este navegador o dispositivo no ofrece geolocalización.' };
  }
  if (!Capacitor.isNativePlatform() && !window.isSecureContext) {
    return { permission: 'no_disponible', snapshot: null, message: 'La geolocalización requiere HTTPS o localhost.' };
  }
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 });
    return {
      permission: 'concedido',
      snapshot: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date(pos.timestamp).toISOString(),
        source: 'dispositivo',
      },
      message: 'Ubicación obtenida del dispositivo.',
    };
  } catch (err) {
    const code = (err as { code?: number }).code;
    const text = String((err as { message?: string }).message ?? '').toLowerCase();
    if (code === 1 || text.includes('denied')) {
      return { permission: 'denegado', snapshot: null, message: 'Permiso de ubicación denegado.' };
    }
    return { permission: 'no_disponible', snapshot: null, message: 'No fue posible obtener la ubicación (tiempo agotado o señal insuficiente).' };
  }
}
