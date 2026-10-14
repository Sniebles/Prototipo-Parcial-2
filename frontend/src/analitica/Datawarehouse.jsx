import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { NIVELES, num, usd } from '../utils/formato.js';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import GraficoBarras from '../components/GraficoBarras.jsx';
import GraficoMeses from '../components/GraficoMeses.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const REQ = [['a', '4a · Ingresos por ciudad'], ['b', '4b · Reservas por ciudad'], ['c', '4c · Millas nacionales por pasajero']];

// Analytics: carga del datawarehouse (sp_cargar_dw) y reportes 4a, 4b, 4c con tabla y gráficos
export default function Datawarehouse() {
  const { notificar } = useToast();
  const [req, setReq] = useState('a');
  const [anio, setAnio] = useState(2026);
  const [cargandoDw, setCargandoDw] = useState(false);
  const anios = useCarga(() => api.get('/dw/anios'), []);
  const rep = useCarga(() => api.get(`/dw/reportes/${req}`, { anio }), [req, anio]);
  const fmt = req === 'a' ? usd : num;
  // En la tabla los meses van sin decimales para que quepan los 12 (los ingresos están en USD)
  const celda = req === 'a' ? (v) => num(Math.round(Number(v))) : num;

  async function cargarDw() {
    setCargandoDw(true);
    try {
      const r = await api.post('/dw/cargar');
      notificar(`Datawarehouse cargado: ${num(r.conteo?.ventas)} ventas, ${num(r.conteo?.reservas)} reservas, ${num(r.conteo?.millas)} acumulaciones de millas`);
      anios.recargar(); rep.recargar();
    } catch (e) { notificar(e.message, 'error'); } finally { setCargandoDw(false); }
  }
  const d = rep.datos;
  const filas = d?.data ?? [];
  const meses = d?.meses ?? [];
  const totalMes = meses.map((m) => filas.reduce((s, f) => s + Number(f[m] || 0), 0));
  const etiqueta = req === 'c' ? 'nombre' : 'ciudad';

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <div><h1>Datawarehouse</h1><p>Hechos y dimensiones de delta_dw. Los 12 meses aparecen aunque no tengan datos.</p></div>
        <div className="fila">
          <div className="campo" style={{ margin: 0 }}><label htmlFor="anio">Año</label>
            <select id="anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {(anios.datos?.data ?? [2026]).map((a) => <option key={a} value={a}>{a}</option>)}
            </select></div>
          <button type="button" className="btn btn-secundario" disabled={cargandoDw} onClick={cargarDw}>{cargandoDw ? 'Cargando…' : 'Cargar datawarehouse (ETL)'}</button>
        </div>
      </div>
      <div className="pestanas" role="tablist">
        {REQ.map(([k, n]) => <button key={k} type="button" role="tab" aria-selected={req === k} onClick={() => setReq(k)}>{n}</button>)}
      </div>
      <ErrorMensaje error={rep.error} onReintentar={rep.recargar} />
      {rep.cargando ? <Loader /> : !filas.length ? <EmptyState icono="📊" titulo="Sin datos para ese año">Pulse "Cargar datawarehouse".</EmptyState> : (
        <>
          <h2 style={{ margin: 0 }}>{d.titulo} · {d.anio}</h2>
          <div className="grid grid-2">
            <div className="tarjeta"><h3>Total por mes</h3><GraficoMeses valores={totalMes} meses={meses} formato={fmt} titulo={`Total por mes ${d.anio}`} /></div>
            <div className="tarjeta"><h3>{req === 'c' ? 'Top 10 pasajeros (millas)' : 'Total por ciudad'}</h3>
              <GraficoBarras datos={filas.slice(0, 10)} etiqueta={etiqueta} valor="total" formato={fmt} titulo="Total" /></div>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla tabla-compacta">
              <thead><tr><th>{req === 'c' ? 'Pasajero' : req === 'a' ? 'Ciudad (USD)' : 'Ciudad'}</th>{req === 'c' && <th>Nivel</th>}{meses.map((m) => <th key={m} className="num">{m}</th>)}<th className="num">Total</th></tr></thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.Idpasajero ?? f.ciudad}>
                    <td style={{ whiteSpace: 'nowrap' }}>{req === 'c' ? f.nombre : <>{f.ciudad} <span className="suave">· {f.pais === 'Colombia' ? 'COL' : 'USA'}</span></>}</td>
                    {req === 'c' && <td>{NIVELES[f.nivelmillas] ?? '—'}</td>}
                    {meses.map((m) => <td key={m} className="num">{celda(f[m])}</td>)}
                    <td className="num"><strong>{celda(f.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={req === 'c' ? 2 : 1}>Total</td>{totalMes.map((v, i) => <td key={meses[i]} className="num">{celda(v)}</td>)}<td className="num">{celda(totalMes.reduce((a, b) => a + b, 0))}</td></tr></tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
