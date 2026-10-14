import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { NOMBRE_ETAPA, hora, hoy } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import Loader from '../components/Loader.jsx';

// Tablero de vuelos del día por aeropuerto de salida (Operational Pipeline)
export default function Tablero() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState({ aeropuerto: usuario?.aeropuerto ?? 'ATL', fecha: hoy() });
  const aeropuertos = useCarga(() => api.get('/aeropuertos'), []);
  const fechas = useCarga(() => api.get('/operacion/fechas', { aeropuerto: filtro.aeropuerto }), [filtro.aeropuerto]);
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/operacion/vuelos', filtro), [filtro]);
  const siguiente = (fechas.datos?.data ?? []).find((f) => f >= filtro.fecha);

  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>Tablero de vuelos</h1><p>Salidas del día, pasajeros, check-in, embarque y última etapa registrada.</p></div></div>
      <div className="tarjeta buscador-vuelos">
        <div className="campo"><label htmlFor="aer">Aeropuerto</label>
          <select id="aer" value={filtro.aeropuerto} onChange={(e) => setFiltro({ ...filtro, aeropuerto: e.target.value })}>
            {(aeropuertos.datos?.data ?? []).map((a) => <option key={a.Idaeropuerto} value={a.Idaeropuerto}>{a.Idaeropuerto} · {a.ciudad}</option>)}
          </select></div>
        <div className="campo"><label htmlFor="dia">Fecha</label><input id="dia" type="date" value={filtro.fecha} onChange={(e) => setFiltro({ ...filtro, fecha: e.target.value })} /></div>
        <div className="campo"><span className="etiqueta">Próximo día con vuelos</span>
          {siguiente && siguiente !== filtro.fecha ? <button type="button" className="btn btn-fantasma" onClick={() => setFiltro({ ...filtro, fecha: siguiente })}>{siguiente}</button> : <span className="suave">—</span>}</div>
        <button type="button" className="btn btn-primario" onClick={recargar}>Actualizar</button>
      </div>
      <ErrorMensaje error={error} onReintentar={recargar} />
      {cargando ? <Loader /> : (
        <DataTable clave="Idvuelo" filas={datos?.data ?? []} vacio="No hay salidas ese día desde este aeropuerto" columnas={[
          { campo: 'numerovuelo', titulo: 'Vuelo', render: (v) => <Link to={`/operacion/vuelo/${v.Idvuelo}`}>{v.numerovuelo}</Link> },
          { campo: 'Iddestino', titulo: 'Destino', render: (v) => `${v.Iddestino} · ${v.ciudaddestino}` },
          { campo: 'salidaprog', titulo: 'Salida', render: (v) => hora(v.salidaprog) },
          { campo: 'puerta', titulo: 'Puerta' },
          { campo: 'pasajeros', titulo: 'Pasajeros', num: true },
          { campo: 'checkin', titulo: 'Check-in', num: true },
          { campo: 'embarcados', titulo: 'Embarcados', num: true },
          { campo: 'ultimaetapa', titulo: 'Última etapa', render: (v) => NOMBRE_ETAPA[v.ultimaetapa] ?? '—' },
          { campo: 'estado', titulo: 'Estado', render: (v) => <EstadoChip entidad="Vuelo" estado={v.estado} /> },
        ]} />
      )}
    </div>
  );
}
