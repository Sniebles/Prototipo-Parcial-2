import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ESTADOS, fecha } from '../utils/formato.js';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import FormField from '../components/FormField.jsx';

// Equipaje: registrar una maleta en el mostrador y escanearla en cada punto (sp_registrar_equipaje / sp_rastrear_equipaje)
export default function Equipaje() {
  const { usuario } = useAuth();
  const { notificar } = useToast();
  const [registro, setRegistro] = useState({ tiquete: '', peso: '23' });
  const [etiqueta, setEtiqueta] = useState('');
  const [escaneo, setEscaneo] = useState({ estado: 'C', aeropuerto: usuario?.aeropuerto ?? 'ATL' });
  const [maleta, setMaleta] = useState(null);
  const [error, setError] = useState(null);
  const ejecutar = async (fn) => { setError(null); try { const m = await fn(); setMaleta(m); setEtiqueta(m.etiqueta); } catch (e) { setError(e); } };

  return (
    <div className="pila">
      <div className="encabezado-pagina"><div><h1>Equipaje</h1><p>Cada lectura queda como un evento con aeropuerto y escáner: así se localiza la maleta.</p></div></div>
      <ErrorMensaje error={error} />
      <div className="grid grid-3">
        <form className="tarjeta" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { const m = await api.post('/operacion/equipaje', registro); notificar(`Maleta ${m.etiqueta} registrada`); return m; }); }}>
          <h2>Registrar maleta</h2>
          <FormField etiqueta="Tiquete (Id o número)" value={registro.tiquete} onChange={(e) => setRegistro({ ...registro, tiquete: e.target.value })} obligatorio />
          <FormField etiqueta="Peso (kg)" type="number" min="1" max="32" value={registro.peso} onChange={(e) => setRegistro({ ...registro, peso: e.target.value })} />
          <button className="btn btn-primario btn-bloque">Registrar</button>
        </form>
        <form className="tarjeta" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { const m = await api.post(`/operacion/equipaje/${encodeURIComponent(etiqueta)}/escaneo`, escaneo); notificar(`Lectura registrada: ${ESTADOS.Equipaje[m.estado][0]}`); return m; }); }}>
          <h2>Escanear maleta</h2>
          <FormField etiqueta="Etiqueta" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} obligatorio />
          <FormField etiqueta="Nuevo estado" as="select" value={escaneo.estado} onChange={(e) => setEscaneo({ ...escaneo, estado: e.target.value })}>
            {Object.entries(ESTADOS.Equipaje).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
          </FormField>
          <FormField etiqueta="Aeropuerto" value={escaneo.aeropuerto} onChange={(e) => setEscaneo({ ...escaneo, aeropuerto: e.target.value.toUpperCase() })} maxLength={3} />
          <div className="fila">
            <button className="btn btn-primario">Registrar lectura</button>
            <button type="button" className="btn btn-fantasma" onClick={() => ejecutar(() => api.get(`/operacion/equipaje/${encodeURIComponent(etiqueta)}`))}>Solo consultar</button>
          </div>
        </form>
        <div className="tarjeta">
          <h2>Maleta</h2>
          {!maleta ? <p className="suave">Registre o consulte una maleta.</p> : (
            <>
              <div className="fila" style={{ justifyContent: 'space-between' }}><strong className="mono">{maleta.etiqueta}</strong><EstadoChip entidad="Equipaje" estado={maleta.estado} /></div>
              <p className="suave">{maleta.pasajero} · vuelo {maleta.numerovuelo} · {maleta.Idorigen} → {maleta.Iddestino} · {maleta.peso} kg</p>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {maleta.eventos.map((e, i) => <li key={i}>{fecha(e.fecha, true)} · {ESTADOS.Equipaje[e.estado]?.[0]} · {e.Idaeropuerto}</li>)}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
