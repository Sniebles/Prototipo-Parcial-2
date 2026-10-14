// Tabla reutilizable con ordenamiento por columna. columnas: [{ campo, titulo, render?, num?, ordenable? }]
import { useMemo, useState } from 'react';
import EmptyState from './EmptyState.jsx';

export default function DataTable({ columnas, filas, clave, vacio = 'No hay registros', pie, caption }) {
  const [orden, setOrden] = useState({ campo: null, asc: true });
  const ordenadas = useMemo(() => {
    if (!orden.campo) return filas;
    const col = columnas.find((c) => c.campo === orden.campo);
    return [...filas].sort((a, b) => {
      const va = a[orden.campo];
      const vb = b[orden.campo];
      const cmp = col?.num ? Number(va) - Number(vb) : String(va ?? '').localeCompare(String(vb ?? ''), 'es');
      return orden.asc ? cmp : -cmp;
    });
  }, [filas, orden, columnas]);

  if (!filas.length) return <div className="tabla-contenedor"><EmptyState titulo={vacio} /></div>;
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.campo ?? c.titulo} className={c.num ? 'num' : undefined} aria-sort={orden.campo === c.campo ? (orden.asc ? 'ascending' : 'descending') : undefined} scope="col">
                {c.ordenable === false || !c.campo ? c.titulo : (
                  <button type="button" onClick={() => setOrden((o) => ({ campo: c.campo, asc: o.campo === c.campo ? !o.asc : true }))}>
                    {c.titulo}{orden.campo === c.campo ? (orden.asc ? ' ▲' : ' ▼') : ''}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((f, i) => (
            <tr key={clave ? f[clave] : i}>
              {columnas.map((c) => (
                <td key={c.campo ?? c.titulo} className={c.num ? 'num' : undefined}>{c.render ? c.render(f) : f[c.campo]}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {pie && <tfoot>{pie}</tfoot>}
      </table>
    </div>
  );
}
