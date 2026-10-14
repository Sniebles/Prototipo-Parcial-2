import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCarga } from '../utils/useCarga.js';
import { fecha, usd } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import Loader from '../components/Loader.jsx';

export default function MisReservas() {
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/mis-reservas'), []);
  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <div><h1>Mis reservas</h1><p>Localizador, tiquetes, pago y factura de cada reserva.</p></div>
        <Link className="btn btn-primario" to="/vuelos">Nueva reserva</Link>
      </div>
      <ErrorMensaje error={error} onReintentar={recargar} />
      {cargando ? <Loader /> : (
        <DataTable clave="Idreserva" filas={datos?.data ?? []} vacio="Aún no tiene reservas" columnas={[
          { campo: 'localizador', titulo: 'Localizador', render: (r) => <Link className="mono" to={`/reservas/${r.Idreserva}`}>{r.localizador}</Link> },
          { campo: 'ruta', titulo: 'Ruta' },
          { campo: 'salida', titulo: 'Salida', render: (r) => fecha(r.salida, true) },
          { campo: 'tiquetes', titulo: 'Tiquetes', num: true },
          { campo: 'subtotal', titulo: 'Valor', num: true, render: (r) => usd(r.subtotal) },
          { campo: 'estado', titulo: 'Estado', render: (r) => <EstadoChip entidad="Reserva" estado={r.estado} /> },
          { campo: 'Idfactura', titulo: 'Factura', render: (r) => (r.Idfactura ? <span className="mono">{r.Idfactura}</span> : '—') },
        ]} />
      )}
    </div>
  );
}
