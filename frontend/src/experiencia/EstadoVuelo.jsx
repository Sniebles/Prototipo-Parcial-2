import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { fecha, hora } from '../utils/formato.js';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import LineaTiempo from '../components/LineaTiempo.jsx';
import Loader from '../components/Loader.jsx';

// "Localización de vuelos": estado del vuelo y sus eventos del pipeline operacional
export default function EstadoVuelo() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos: v, cargando, error, recargar } = useCarga(() => api.get(`/vuelos/${id}/estado`), [id]);
  if (cargando) return <Loader />;
  if (error) return <ErrorMensaje error={error} onReintentar={recargar} />;
  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <div><h1>Vuelo {v.numerovuelo} · {v.Idorigen} → {v.Iddestino}</h1><p>{v.ciudadorigen} → {v.ciudaddestino} · {fecha(v.fecha)}</p></div>
        <div className="fila">
          <EstadoChip entidad="Vuelo" estado={v.estado} />
          <button type="button" className="btn btn-fantasma btn-sm" onClick={recargar}>Actualizar</button>
          {usuario?.rol === 'EMPLEADO' && <Link className="btn btn-primario btn-sm" to={`/operacion/vuelo/${v.Idvuelo}`}>Registrar etapa</Link>}
        </div>
      </div>
      <div className="grid grid-4">
        <div className="tarjeta kpi"><span className="etiqueta">Salida programada</span><span className="valor">{hora(v.salidaprog)}</span></div>
        <div className="tarjeta kpi"><span className="etiqueta">Salida real</span><span className="valor">{hora(v.salidareal)}</span></div>
        <div className="tarjeta kpi"><span className="etiqueta">Llegada real</span><span className="valor">{hora(v.llegadareal)}</span></div>
        <div className="tarjeta kpi"><span className="etiqueta">Puerta</span><span className="valor">{v.puerta ?? '—'}</span></div>
      </div>
      <div className="tarjeta">
        <h2>Etapas del vuelo</h2>
        <LineaTiempo eventos={v.eventos} />
      </div>
    </div>
  );
}
