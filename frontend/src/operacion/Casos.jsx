import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { TIPOS_CASO, fecha } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import Loader from '../components/Loader.jsx';

// Casos de servicio al cliente: atender y cerrar
export default function Casos() {
  const { notificar } = useToast();
  const [estado, setEstado] = useState('A');
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/operacion/casos', { estado }), [estado]);
  async function cerrar(c) {
    try { await api.post(`/operacion/casos/${c.Idcaso}/cerrar`); notificar(`Caso ${c.Idcaso} cerrado`); recargar(); } catch (e) { notificar(e.message, 'error'); }
  }
  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>Casos de servicio al cliente</h1><p>Maletas perdidas, vuelos, reembolsos y otras solicitudes.</p></div></div>
      <div className="pestanas" role="tablist">
        {[['A', 'Abiertos'], ['C', 'Cerrados']].map(([k, n]) => <button key={k} type="button" role="tab" aria-selected={estado === k} onClick={() => setEstado(k)}>{n}</button>)}
      </div>
      <ErrorMensaje error={error} onReintentar={recargar} />
      {cargando ? <Loader /> : (
        <DataTable clave="Idcaso" filas={datos?.data ?? []} vacio="No hay casos" columnas={[
          { campo: 'Idcaso', titulo: 'Caso', render: (c) => <span className="mono">{c.Idcaso}</span> },
          { campo: 'fecha', titulo: 'Fecha', render: (c) => fecha(c.fecha, true) },
          { campo: 'cliente', titulo: 'Cliente' },
          { campo: 'tipo', titulo: 'Tipo', render: (c) => TIPOS_CASO[c.tipo] },
          { campo: 'descripcion', titulo: 'Descripción' },
          { campo: 'etiqueta', titulo: 'Maleta / vuelo', render: (c) => [c.etiqueta, c.numerovuelo].filter(Boolean).join(' · ') || '—' },
          { titulo: '', render: (c) => (c.estado === 'A' ? <button type="button" className="btn btn-exito btn-sm" onClick={() => cerrar(c)}>Cerrar caso</button> : <span className="suave">{c.empleado ?? ''}</span>) },
        ]} />
      )}
    </div>
  );
}
