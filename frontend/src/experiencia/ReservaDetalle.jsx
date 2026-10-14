import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarga } from '../utils/useCarga.js';
import { CLASES, MEDIOS_PAGO, fecha, usd } from '../utils/formato.js';
import DataTable from '../components/DataTable.jsx';
import EstadoChip from '../components/EstadoChip.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';

// Detalle de la reserva: pagar con la pasarela simulada (sp_pagar), check-in (sp_checkin) y pase de abordar
export default function ReservaDetalle() {
  const { id } = useParams();
  const { notificar } = useToast();
  const { datos: r, cargando, error, recargar } = useCarga(() => api.get(`/reservas/${id}`), [id]);
  const [pago, setPago] = useState({ medio: 'C', tarjeta: '4111 1111 1111 1111' });
  const [ocupado, setOcupado] = useState(false);

  async function pagar(e) {
    e.preventDefault();
    setOcupado(true);
    try {
      const res = await api.post(`/reservas/${id}/pagar`, pago);
      notificar(res.mensaje, res.estado === 'A' ? 'exito' : 'error');
      recargar();
    } catch (err) { notificar(err.message, 'error'); } finally { setOcupado(false); }
  }
  async function checkin(t) {
    setOcupado(true);
    try {
      const res = await api.post(`/tiquetes/${t.Idtiquete}/checkin`);
      notificar(`Check-in listo. Pase de abordar ${res.pase}`);
      recargar();
    } catch (err) { notificar(err.message, 'error'); } finally { setOcupado(false); }
  }

  if (cargando) return <Loader />;
  if (error) return <ErrorMensaje error={error} onReintentar={recargar} />;
  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <div><h1>Reserva <span className="mono">{r.localizador}</span></h1><p>Creada el {fecha(r.fecha, true)}</p></div>
        <EstadoChip entidad="Reserva" estado={r.estado} />
      </div>
      <div className="tarjeta">
        <h2>Tiquetes</h2>
        <DataTable clave="Idtiquete" filas={r.tiquetes} columnas={[
          { campo: 'numerovuelo', titulo: 'Vuelo', render: (t) => <Link to={`/vuelo/${t.Idvuelo}`}>{t.numerovuelo} · {t.Idorigen} → {t.Iddestino}</Link> },
          { campo: 'salidaprog', titulo: 'Salida', render: (t) => fecha(t.salidaprog, true) },
          { campo: 'clase', titulo: 'Clase / silla', render: (t) => `${CLASES[t.clase]} · ${t.asiento ?? '—'}` },
          { campo: 'valor', titulo: 'Valor', num: true, render: (t) => usd(t.valor) },
          { campo: 'estado', titulo: 'Estado', render: (t) => <EstadoChip entidad="Tiquete" estado={t.estado} /> },
          { titulo: 'Check-in', render: (t) => (t.pase ? <Link className="btn btn-secundario btn-sm" to={`/pase/${t.Idtiquete}`}>Ver pase {t.pase}</Link>
            : t.estado === 'E' && ['P', 'E', 'D'].includes(t.estadovuelo) ? <button type="button" className="btn btn-primario btn-sm" disabled={ocupado} onClick={() => checkin(t)}>Hacer check-in</button>
              : <span className="suave">{t.estado === 'R' ? 'Pague primero' : '—'}</span>) },
        ]} />
      </div>
      <div className="grid grid-2">
        {r.estado === 'A' && r.porPagar > 0 && (
          <form className="tarjeta" onSubmit={pagar}>
            <h2>Pagar {usd(r.porPagar)}</h2>
            <p className="suave">Incluye 10 % de impuestos. Pasarela de pagos simulada: la tarjeta 4000 0000 0000 0002 se rechaza.</p>
            <FormField etiqueta="Medio de pago" as="select" value={pago.medio} onChange={(e) => setPago({ ...pago, medio: e.target.value })}>
              {Object.entries(MEDIOS_PAGO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </FormField>
            {pago.medio !== 'P' && <FormField etiqueta="Número de tarjeta" value={pago.tarjeta} onChange={(e) => setPago({ ...pago, tarjeta: e.target.value })} inputMode="numeric" />}
            <button className="btn btn-primario btn-bloque" disabled={ocupado}>{ocupado ? 'Procesando…' : 'Pagar'}</button>
          </form>
        )}
        <div className="tarjeta">
          <h2>Pagos y factura</h2>
          {r.pagos.length ? (
            <ul style={{ paddingLeft: 18 }}>
              {r.pagos.map((p) => <li key={p.Idpago}>{fecha(p.fecha, true)} · {MEDIOS_PAGO[p.medio] ?? p.medio} · {usd(p.valor)} <EstadoChip entidad="Pago" estado={p.estado} /></li>)}
            </ul>
          ) : <p className="suave">Sin pagos todavía.</p>}
          {r.factura ? (
            <div className="totales" style={{ marginLeft: 0 }}>
              <div><span>Factura</span><span className="mono">{r.factura.Idfactura}</span></div>
              <div><span>Subtotal</span><span>{usd(r.factura.subtotal)}</span></div>
              <div><span>Impuestos</span><span>{usd(r.factura.impuestos)}</span></div>
              <div className="total"><span>Total</span><span>{usd(r.factura.total)}</span></div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
