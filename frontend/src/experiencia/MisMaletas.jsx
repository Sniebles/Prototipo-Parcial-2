import { api } from '../api/client.js';
import { useCarga } from '../utils/useCarga.js';
import { ESTADOS, fecha } from '../utils/formato.js';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';

// "Localización de maletas": cada maleta con sus lecturas (EventoEquipaje)
export default function MisMaletas() {
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/mis-maletas'), []);
  if (cargando) return <Loader />;
  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>Mis maletas</h1><p>Dónde está cada maleta según la última lectura de los escáneres.</p></div></div>
      <ErrorMensaje error={error} onReintentar={recargar} />
      {!datos?.data.length ? <EmptyState icono="🧳" titulo="No tiene maletas registradas" /> : (
        <div className="grid grid-2">
          {datos.data.map((m) => {
            const ultima = m.eventos[m.eventos.length - 1];
            return (
              <div className="tarjeta" key={m.Idequipaje}>
                <div className="fila" style={{ justifyContent: 'space-between' }}>
                  <h3 className="mono" style={{ margin: 0 }}>{m.etiqueta}</h3>
                  <EstadoChip entidad="Equipaje" estado={m.estado} />
                </div>
                <p className="suave">Vuelo {m.numerovuelo} · {m.Idorigen} → {m.Iddestino} · {fecha(m.salidaprog)} · {m.peso} kg</p>
                {ultima && <p><strong>Última lectura:</strong> {ultima.Idaeropuerto} ({ultima.ciudad}), {fecha(ultima.fecha, true)}</p>}
                <ol style={{ paddingLeft: 18, margin: 0 }} className="suave">
                  {m.eventos.map((e, i) => <li key={i}>{fecha(e.fecha, true)} · {ESTADOS.Equipaje[e.estado]?.[0]} · {e.Idaeropuerto}{e.equipo ? ` · ${e.equipo}` : ''}</li>)}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
