import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { CLASES, fecha, hora, hoy, usd } from '../utils/formato.js';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Buscar vuelos por origen, destino y fecha, y reservar (sp_reservar)
export default function BuscarVuelos() {
  const [params] = useSearchParams();
  const [filtro, setFiltro] = useState({ origen: params.get('origen') || 'ATL', destino: params.get('destino') || 'JFK', fecha: params.get('fecha') || hoy() });
  const [busqueda, setBusqueda] = useState(filtro);
  const { usuario } = useAuth();
  const { notificar } = useToast();
  const navegar = useNavigate();
  const aeropuertos = useCarga(() => api.get('/aeropuertos'), []);
  const vuelos = useCarga(() => api.get('/vuelos', busqueda), [busqueda]);
  const [reservando, setReservando] = useState(null);

  async function reservar(v, clase) {
    if (!usuario) { navegar('/login', { state: { desde: '/vuelos' } }); return; }
    setReservando(v.Idvuelo + clase);
    try {
      const r = await api.post('/reservas', { Idvuelo: v.Idvuelo, clase });
      notificar(`Reserva ${r.localizador} creada. Ahora puede pagarla.`);
      navegar(`/reservas/${r.Idreserva}`);
    } catch (e) { notificar(e.message, 'error'); } finally { setReservando(null); }
  }
  const lista = aeropuertos.datos?.data ?? [];
  const sel = (campo) => (
    <div className="campo">
      <label htmlFor={campo}>{campo === 'origen' ? 'Origen' : 'Destino'}</label>
      <select id={campo} value={filtro[campo]} onChange={(e) => setFiltro({ ...filtro, [campo]: e.target.value })}>
        {lista.map((a) => <option key={a.Idaeropuerto} value={a.Idaeropuerto}>{a.Idaeropuerto} · {a.ciudad} ({a.pais})</option>)}
      </select>
    </div>
  );

  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>Buscar vuelos</h1><p>Vuelos programados de los próximos 30 días desde la fecha elegida.</p></div></div>
      <form className="tarjeta buscador-vuelos" onSubmit={(e) => { e.preventDefault(); setBusqueda(filtro); }}>
        {sel('origen')}{sel('destino')}
        <div className="campo"><label htmlFor="fecha">Desde</label><input id="fecha" type="date" value={filtro.fecha} onChange={(e) => setFiltro({ ...filtro, fecha: e.target.value })} /></div>
        <button className="btn btn-primario">Buscar</button>
      </form>
      <ErrorMensaje error={vuelos.error} onReintentar={vuelos.recargar} />
      {vuelos.cargando ? <Loader /> : !vuelos.datos?.data.length ? (
        <EmptyState icono="✈" titulo="No hay vuelos para esa ruta y fecha">Pruebe otra fecha o la ruta inversa.</EmptyState>
      ) : vuelos.datos.data.map((v) => (
        <div className="tarjeta vuelo-fila" key={v.Idvuelo}>
          <div>
            <div className="horas">{hora(v.salidaprog)} → {hora(v.llegadaprog)}</div>
            <div className="suave">{fecha(v.fecha)} · Vuelo {v.numerovuelo}</div>
          </div>
          <div>
            <strong>{v.Idorigen} → {v.Iddestino}</strong>
            <div className="suave">{v.ciudadorigen} → {v.ciudaddestino} · {v.distancia} millas</div>
            <div className="fila" style={{ marginTop: 4 }}><EstadoChip entidad="Vuelo" estado={v.estado} /><span className="suave">{v.sillas} sillas</span></div>
          </div>
          <div className="clases">
            {Object.entries(CLASES).map(([c, n]) => (
              <button type="button" key={c} className="clase-btn" disabled={reservando !== null || v.sillas <= 0} onClick={() => reservar(v, c)}>
                <span className="suave">{n}</span><strong>{usd(v.precios[c])}</strong>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
