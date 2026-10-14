import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCarga } from '../utils/useCarga.js';
import { CLASES, fecha, hora } from '../utils/formato.js';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import Loader from '../components/Loader.jsx';

export default function PaseAbordar() {
  const { id } = useParams();
  const { datos: p, cargando, error, recargar } = useCarga(() => api.get(`/tiquetes/${id}/pase`), [id]);
  if (cargando) return <Loader />;
  if (error) return <ErrorMensaje error={error} onReintentar={recargar} />;
  return (
    <div className="pila">
      <div className="encabezado-pagina no-imprimir"><div><h1>Pase de abordar</h1><p>Preséntelo en la puerta: el lector registra su embarque.</p></div>
        <button type="button" className="btn btn-fantasma" onClick={() => window.print()}>Imprimir</button></div>
      <article className="pase">
        <div className="pase-cabecera"><strong>Delta Air Lines · Boarding pass</strong><span>Vuelo {p.numerovuelo}</span></div>
        <div className="pase-cuerpo">
          <div className="suave">Pasajero</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.pasajero}</div>
          <div className="pase-ruta"><span>{p.Idorigen}</span><span aria-hidden="true">✈</span><span>{p.Iddestino}</span></div>
          <div className="pase-datos">
            <div><span>Fecha</span><strong>{fecha(p.salidaprog)}</strong></div>
            <div><span>Embarque</span><strong>{hora(p.embarque)}</strong></div>
            <div><span>Puerta</span><strong>{p.puerta ?? 'Por asignar'}</strong></div>
            <div><span>Silla</span><strong>{p.asiento} · {CLASES[p.clase]}</strong></div>
          </div>
        </div>
        <div className="pase-talon">
          <div className="codigo-barras" aria-hidden="true" />
          <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.pase}</span>
          <span className="suave mono">Tiquete {p.numero}</span>
        </div>
      </article>
    </div>
  );
}
