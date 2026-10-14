// Hook de carga de datos: { datos, cargando, error, recargar }
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCarga(funcion, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const vigente = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    vigente.current += 1;
    const id = vigente.current;
    setCargando(true);
    setError(null);
    try {
      const r = await funcion();
      if (id === vigente.current) setDatos(r);
    } catch (e) {
      if (id === vigente.current) setError(e);
    } finally {
      if (id === vigente.current) setCargando(false);
    }
  }, dependencias);

  useEffect(() => { recargar(); }, [recargar]);
  return { datos, cargando, error, recargar, setDatos };
}
