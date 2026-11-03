// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useEffect, useState } from 'react';

/**
 * Estado de la conexión a internet (navigator.onLine y eventos online/offline).
 * «En línea» solo indica que hay una red: tras un sismo puede haber red pero estar saturada.
 * Sin internet siguen funcionando la alerta local, el SMS (requiere señal celular), la llamada al 123,
 * la brújula y el esquema del mapa; no funcionan el mapa real ni los sismos recientes.
 */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(isOnline);
  useEffect(() => {
    const update = () => setOnline(isOnline());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}
