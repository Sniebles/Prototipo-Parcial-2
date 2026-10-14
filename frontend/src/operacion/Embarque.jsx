import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import FormField from '../components/FormField.jsx';

// Embarque: el lector de puerta lee el pase de abordar (sp_embarcar marca el tiquete como usado y suma millas)
export default function Embarque() {
  const { notificar } = useToast();
  const [pase, setPase] = useState('');
  const [error, setError] = useState(null);
  const [leidos, setLeidos] = useState([]);
  async function leer(e) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api.post('/operacion/embarque', { pase });
      notificar(r.mensaje);
      setLeidos((l) => [{ ...r, pase: pase.toUpperCase() }, ...l]);
      setPase('');
    } catch (err) { setError(err); }
  }
  return (
    <div className="dos-columnas">
      <div className="pila">
        <div className="encabezado-pagina"><div><h1>Embarque en puerta</h1><p>Lea o escriba el código del pase de abordar (por ejemplo BP0000600).</p></div></div>
        <ErrorMensaje error={error} />
        <div className="tarjeta">
          <h2>Embarcados en esta sesión</h2>
          {leidos.length ? <ul style={{ paddingLeft: 18, margin: 0 }}>{leidos.map((l) => <li key={l.pase}><span className="mono">{l.pase}</span> · {l.pasajero} · vuelo {l.numerovuelo} · silla {l.asiento}</li>)}</ul>
            : <p className="suave">Todavía no ha leído pases.</p>}
        </div>
      </div>
      <form className="tarjeta" onSubmit={leer}>
        <h2>Lector de puerta</h2>
        <FormField etiqueta="Pase de abordar" value={pase} onChange={(e) => setPase(e.target.value)} obligatorio autoFocus className="mono" />
        <button className="btn btn-primario btn-bloque">Registrar embarque</button>
      </form>
    </div>
  );
}
