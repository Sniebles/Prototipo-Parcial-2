// Modal accesible: role="dialog", foco inicial, trampa de foco y cierre con Esc
import { useEffect, useRef } from 'react';

export default function Modal({ titulo, onCerrar, children, pie, ancho }) {
  const ref = useRef(null);
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    const previo = document.activeElement;
    const nodo = ref.current;
    const enfocables = () => nodo.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (enfocables()[1] ?? enfocables()[0])?.focus();
    function teclado(e) {
      if (e.key === 'Escape') cerrarRef.current?.();
      if (e.key === 'Tab') {
        const lista = [...enfocables()].filter((el) => !el.disabled);
        if (!lista.length) return;
        const primero = lista[0];
        const ultimo = lista[lista.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    }
    nodo.addEventListener('keydown', teclado);
    return () => { nodo.removeEventListener('keydown', teclado); previo?.focus?.(); };
  }, []);

  return (
    <div className="modal-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={ref} style={ancho ? { width: `min(${ancho}px, 100%)` } : undefined}>
        <div className="modal-cabecera">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="cerrar-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-cuerpo">{children}</div>
        {pie && <div className="modal-pie">{pie}</div>}
      </div>
    </div>
  );
}
