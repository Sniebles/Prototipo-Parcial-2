import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { ETAPAS, fecha, hora } from '../utils/formato.js';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import FormField from '../components/FormField.jsx';
import LineaTiempo from '../components/LineaTiempo.jsx';
import Loader from '../components/Loader.jsx';

const ROL = { P: 'Piloto', C: 'Copiloto', A: 'Auxiliar' };

// Registrar las etapas del pipeline operacional (sp_registrar_evento_vuelo)
export default function VueloOperacion() {
  const { id } = useParams();
  const { notificar } = useToast();
  const { datos: v, cargando, error, recargar } = useCarga(() => api.get(`/vuelos/${id}/estado`), [id]);
  const [descripcion, setDescripcion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  if (cargando) return <Loader />;
  if (error) return <ErrorMensaje error={error} onReintentar={recargar} />;
  const hechas = new Set(v.eventos.map((e) => e.etapa));
  const sig = ETAPAS.find(([c]) => !hechas.has(c));

  async function registrar(etapa) {
    setOcupado(true);
    try {
      const r = await api.post(`/operacion/vuelos/${id}/eventos`, { etapa, descripcion });
      notificar(`Etapa registrada. Estado del vuelo: ${r.vuelo.estado}`);
      setDescripcion('');
      recargar();
    } catch (e) { notificar(e.message, 'error'); } finally { setOcupado(false); }
  }
  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <div><h1>Vuelo {v.numerovuelo} · {v.Idorigen} → {v.Iddestino}</h1><p>{fecha(v.fecha)} · salida {hora(v.salidaprog)} · puerta {v.puerta ?? '—'} · {v.sillas} sillas libres</p></div>
        <EstadoChip entidad="Vuelo" estado={v.estado} />
      </div>
      <div className="dos-columnas">
        <div className="tarjeta"><h2>Etapas del pipeline operacional</h2><LineaTiempo eventos={v.eventos} /></div>
        <div className="pila">
          <div className="tarjeta">
            <h2>Registrar etapa</h2>
            <FormField etiqueta="Observación (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={100} />
            {sig ? <button type="button" className="btn btn-primario btn-bloque" disabled={ocupado} onClick={() => registrar(sig[0])}>Registrar: {sig[1]}</button>
              : <p className="alerta alerta-exito">Todas las etapas están registradas.</p>}
            <details style={{ marginTop: 12 }}><summary className="suave">Registrar otra etapa</summary>
              <div className="fila" style={{ marginTop: 8 }}>{ETAPAS.map(([c, n]) => <button key={c} type="button" className="btn btn-fantasma btn-sm" disabled={ocupado} onClick={() => registrar(c)}>{n}</button>)}</div>
            </details>
          </div>
          <div className="tarjeta"><h3>Tripulación</h3>
            {v.tripulacion.length ? <ul style={{ paddingLeft: 18, margin: 0 }}>{v.tripulacion.map((t) => <li key={t.nombre}>{ROL[t.rol]}: {t.nombre}</li>)}</ul> : <p className="suave">Sin asignar</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
