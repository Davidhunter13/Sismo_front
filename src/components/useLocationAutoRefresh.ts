// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useRef } from 'react';
import { useAppState } from '../context/appContext';
import { requestDeviceLocation } from '../services/locationService';

/** Cada cuánto se actualiza la ubicación mientras la app está en pantalla. */
export const LOCATION_REFRESH_MS = 5 * 60 * 1000;

/**
 * Mantiene la última ubicación al día: cada 5 minutos y al volver a la app si la última tiene más de 5 minutos.
 * Solo con la app abierta y visible (sin permiso de ubicación en segundo plano ni gasto de batería con la
 * pantalla apagada), solo si el permiso ya está concedido (nunca muestra el diálogo del sistema) y nunca
 * reemplaza las coordenadas de prueba que el usuario eligió a propósito.
 */
export function useLocationAutoRefresh() {
  const { data, setLocation } = useAppState();
  const state = useRef({ data, busy: false });
  state.current.data = data;

  useEffect(() => {
    const refresh = async (onlyIfStale: boolean) => {
      const { data: d, busy } = state.current;
      if (busy || document.visibilityState !== 'visible' || !d.settings.onboarded) return;
      if (d.locationPermission !== 'concedido' || d.lastLocation?.source === 'prueba') return;
      const age = d.lastLocation ? Date.now() - new Date(d.lastLocation.timestamp).getTime() : Infinity;
      if (onlyIfStale && age < LOCATION_REFRESH_MS) return;
      state.current.busy = true;
      try {
        const result = await requestDeviceLocation();
        // Si falla (sin señal), se conserva la última ubicación conocida.
        if (result.snapshot) setLocation(result.snapshot, result.permission);
      } finally {
        state.current.busy = false;
      }
    };
    const timer = window.setInterval(() => void refresh(false), LOCATION_REFRESH_MS);
    const onVisible = () => void refresh(true);
    document.addEventListener('visibilitychange', onVisible);
    void refresh(true);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [setLocation]);
}
