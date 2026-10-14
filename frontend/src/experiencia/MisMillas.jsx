import { api } from '../api/client.js';
import { useCarga } from '../utils/useCarga.js';
import { NIVELES, fecha, num } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';

export default function MisMillas() {
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/mis-millas'), []);
  if (cargando) return <Loader />;
  if (error) return <ErrorMensaje error={error} onReintentar={recargar} />;
  if (!datos.cuenta) return <EmptyState icono="⭐" titulo="No tiene cuenta SkyMiles">Las millas se acumulan al embarcar cuando el pasajero tiene cuenta.</EmptyState>;
  const { cuenta, movimientos } = datos;
  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>SkyMiles</h1><p>Cuenta <span className="mono">{cuenta.numero}</span></p></div></div>
      <div className="grid grid-4">
        <div className="tarjeta kpi"><span className="etiqueta">Saldo</span><span className="valor">{num(cuenta.saldo)} millas</span></div>
        <div className="tarjeta kpi"><span className="etiqueta">Nivel</span><span className="valor">{NIVELES[cuenta.nivel]}</span></div>
        <div className="tarjeta kpi"><span className="etiqueta">Vuelos con millas</span><span className="valor">{movimientos.filter((m) => m.tipo === 'A').length}</span></div>
      </div>
      <DataTable filas={movimientos} vacio="Sin movimientos" columnas={[
        { campo: 'fecha', titulo: 'Fecha', render: (m) => fecha(m.fecha, true) },
        { campo: 'numerovuelo', titulo: 'Vuelo', render: (m) => (m.numerovuelo ? `${m.numerovuelo} · ${m.ruta}` : '—') },
        { campo: 'tipo', titulo: 'Tipo', render: (m) => (m.tipo === 'A' ? 'Acumulación' : 'Redención') },
        { campo: 'millas', titulo: 'Millas', num: true, render: (m) => num(m.millas) },
      ]} />
    </div>
  );
}
