// Línea de tiempo de las 8 etapas del pipeline operacional de un vuelo (EventoVuelo)
import { ETAPAS } from '../utils/formato.js';
import { fecha } from '../utils/formato.js';

export default function LineaTiempo({ eventos }) {
  const porEtapa = Object.fromEntries(eventos.map((e) => [e.etapa, e]));
  const ultima = eventos.length ? ETAPAS.findIndex(([c]) => c === eventos[eventos.length - 1].etapa) : -1;
  return (
    <ol className="linea-tiempo">
      {ETAPAS.map(([c, nombre], i) => {
        const ev = porEtapa[c];
        const clase = ev ? 'hecho' : i === ultima + 1 ? 'siguiente' : '';
        return (
          <li key={c} className={clase}>
            <span className="punto" aria-hidden="true">{ev ? '✓' : i + 1}</span>
            <div>
              <strong>{nombre}</strong>
              <span className="suave">{ev ? `${fecha(ev.fecha, true)}${ev.descripcion ? ` · ${ev.descripcion}` : ''}` : i === ultima + 1 ? 'Siguiente etapa' : 'Pendiente'}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
