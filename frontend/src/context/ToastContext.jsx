// Notificaciones accesibles (aria-live) para mensajes de estado del servidor
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const secuencia = useRef(0);

  const cerrar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notificar = useCallback((mensaje, tipo = 'exito', duracion = 5000) => {
    secuencia.current += 1;
    const id = secuencia.current;
    setToasts((t) => [...t.slice(-3), { id, mensaje, tipo }]);
    if (duracion) setTimeout(() => cerrar(id), duracion);
  }, [cerrar]);

  const valor = useMemo(() => ({ notificar }), [notificar]);
  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`} role={t.tipo === 'error' ? 'alert' : 'status'}>
            <span className="toast-icono" aria-hidden="true">{t.tipo === 'error' ? '⚠' : t.tipo === 'info' ? 'ℹ' : '✔'}</span>
            <span>{t.mensaje}</span>
            <button type="button" className="toast-cerrar" onClick={() => cerrar(t.id)} aria-label="Cerrar notificación">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
