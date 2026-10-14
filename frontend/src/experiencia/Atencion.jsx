import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { TIPOS_CASO, fecha } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import FormField from '../components/FormField.jsx';

// Atención al cliente: abrir un caso (CasoServicio) ligado a un vuelo o a una maleta
export default function Atencion() {
  const { notificar } = useToast();
  const casos = useCarga(() => api.get('/mis-casos'), []);
  const opciones = useCarga(() => api.get('/mis-casos/opciones'), []);
  const [form, setForm] = useState({ tipo: 'M', descripcion: '', Idvuelo: '', Idequipaje: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true); setErrores({});
    try {
      const r = await api.post('/mis-casos', form);
      notificar(`Caso ${r.Idcaso} abierto. Un agente de servicio al cliente lo atenderá.`);
      setForm({ tipo: 'M', descripcion: '', Idvuelo: '', Idequipaje: '' });
      casos.recargar();
    } catch (err) { setErrores(err.erroresCampos); notificar(err.message, 'error'); } finally { setEnviando(false); }
  }
  const op = opciones.datos ?? { vuelos: [], maletas: [] };
  return (
    <div className="dos-columnas">
      <div className="pila">
        <div className="encabezado-pagina"><div><h1>Atención al cliente</h1><p>Sus casos y su estado.</p></div></div>
        <ErrorMensaje error={casos.error} onReintentar={casos.recargar} />
        <DataTable clave="Idcaso" filas={casos.datos?.data ?? []} vacio="No ha abierto casos" columnas={[
          { campo: 'Idcaso', titulo: 'Caso', render: (c) => <span className="mono">{c.Idcaso}</span> },
          { campo: 'fecha', titulo: 'Fecha', render: (c) => fecha(c.fecha, true) },
          { campo: 'tipo', titulo: 'Tipo', render: (c) => TIPOS_CASO[c.tipo] },
          { campo: 'descripcion', titulo: 'Descripción' },
          { campo: 'estado', titulo: 'Estado', render: (c) => <EstadoChip entidad="Caso" estado={c.estado} /> },
        ]} />
      </div>
      <form className="tarjeta" onSubmit={enviar}>
        <h2>Abrir un caso</h2>
        <FormField etiqueta="Tipo" as="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          {Object.entries(TIPOS_CASO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </FormField>
        <FormField etiqueta="Vuelo (opcional)" as="select" value={form.Idvuelo} error={errores.Idvuelo} onChange={(e) => setForm({ ...form, Idvuelo: e.target.value })}>
          <option value="">—</option>
          {op.vuelos.map((v) => <option key={v.Idvuelo} value={v.Idvuelo}>{v.numerovuelo} · {v.ruta} · {fecha(v.fecha)}</option>)}
        </FormField>
        <FormField etiqueta="Maleta (opcional)" as="select" value={form.Idequipaje} error={errores.Idequipaje} onChange={(e) => setForm({ ...form, Idequipaje: e.target.value })}>
          <option value="">—</option>
          {op.maletas.map((m) => <option key={m.Idequipaje} value={m.Idequipaje}>{m.etiqueta}</option>)}
        </FormField>
        <FormField etiqueta="Descripción" as="textarea" obligatorio value={form.descripcion} error={errores.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} ayuda="Mínimo 10 caracteres" />
        <button className="btn btn-primario btn-bloque" disabled={enviando}>Enviar</button>
      </form>
    </div>
  );
}
