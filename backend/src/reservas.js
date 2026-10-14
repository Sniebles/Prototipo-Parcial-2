// Reservas y pagos: buscar vuelos, reservar (sp_reservar), pagar (sp_pagar) y consultar mis reservas.
import express from 'express';
import { query, uno, llamar } from './db.js';
import { requiere } from './auth.js';
import { ah, AppError, codigo, fecha } from './util.js';
import { cobrar } from './pasarela.js';

const r = express.Router();
// [SUPUESTO-1] del punto 3: tarifa = 50 + distancia x tarifa por milla según la clase
const TARIFA = { E: 0.18, P: 0.27, B: 0.54 };
const precio = (distancia, clase) => Math.round((50 + distancia * TARIFA[clase]) * 100) / 100;

const VUELO_SQL = `
  SELECT v.Idvuelo, v.fecha, v.salidaprog, v.llegadaprog, v.salidareal, v.llegadareal, v.estado,
         pr.numerovuelo, r.Idruta, r.distancia, r.Idorigen, r.Iddestino,
         co.nombre AS ciudadorigen, cd.nombre AS ciudaddestino, pu.codigo AS puerta,
         a.capacidad - (SELECT COUNT(*) FROM Tiquete t WHERE t.Idvuelo = v.Idvuelo AND t.estado <> 'C') AS sillas
    FROM Vuelo v
    JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
    JOIN Ruta r ON r.Idruta = pr.Idruta
    JOIN Aeropuerto ao ON ao.Idaeropuerto = r.Idorigen JOIN Ciudad co ON co.Idciudad = ao.Idciudad
    JOIN Aeropuerto ad ON ad.Idaeropuerto = r.Iddestino JOIN Ciudad cd ON cd.Idciudad = ad.Idciudad
    JOIN Avion a ON a.Idavion = v.Idavion
    LEFT JOIN Puerta pu ON pu.Idpuerta = v.Idpuerta`;
export { VUELO_SQL };

// Buscar vuelos por origen, destino y fecha (desde esa fecha, próximos 30 días)
r.get('/vuelos', ah(async (req, res) => {
  const { origen, destino } = req.query;
  if (!origen || !destino) throw new AppError(400, 'Indique el origen y el destino');
  const desde = fecha(req.query.fecha, 'fecha');
  const filas = await query(
    `${VUELO_SQL}
      WHERE r.Idorigen = ? AND r.Iddestino = ? AND v.estado IN ('P', 'D')
        AND v.fecha BETWEEN ? AND DATE_ADD(?, INTERVAL 30 DAY)
      ORDER BY v.salidaprog LIMIT 20`, [origen, destino, desde, desde]);
  res.json({ data: filas.map((v) => ({ ...v, precios: { E: precio(v.distancia, 'E'), P: precio(v.distancia, 'P'), B: precio(v.distancia, 'B') } })) });
}));

// Reservar: crea la reserva y su tiquete (sp_reservar -> sp_agregar_tiquete)
r.post('/reservas', requiere('PASAJERO'), ah(async (req, res) => {
  const clase = codigo(req.body.clase, 'clase', ['E', 'P', 'B']);
  const idvuelo = String(req.body.Idvuelo ?? '');
  const { idreserva, localizador } = await llamar('sp_reservar', [req.usuario.id, idvuelo, clase, 'W', null], ['idreserva', 'localizador']);
  res.status(201).json({ Idreserva: idreserva, localizador });
}));

r.get('/mis-reservas', requiere('PASAJERO'), ah(async (req, res) => {
  const filas = await query(
    `SELECT re.Idreserva, re.localizador, re.fecha, re.estado, f.Idfactura, f.total,
            COUNT(t.Idtiquete) AS tiquetes, IFNULL(SUM(t.valor), 0) AS subtotal,
            MIN(v.salidaprog) AS salida, MIN(CONCAT(r.Idorigen, ' → ', r.Iddestino)) AS ruta
       FROM Reserva re
       JOIN Tiquete t ON t.Idreserva = re.Idreserva
       JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
       JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta
       LEFT JOIN Factura f ON f.Idreserva = re.Idreserva
      WHERE re.Idcliente = ?
      GROUP BY re.Idreserva, re.localizador, re.fecha, re.estado, f.Idfactura, f.total
      ORDER BY salida DESC`, [req.usuario.id]);
  res.json({ data: filas });
}));

async function reservaDelPasajero(id, usuario) {
  const re = await uno('SELECT * FROM Reserva WHERE Idreserva = ?', [id]);
  if (!re) throw new AppError(404, 'La reserva no existe');
  if (usuario.rol === 'PASAJERO' && re.Idcliente !== usuario.id) throw new AppError(403, 'Esta reserva no es suya');
  return re;
}

r.get('/reservas/:id', requiere('PASAJERO'), ah(async (req, res) => {
  const re = await reservaDelPasajero(req.params.id, req.usuario);
  const tiquetes = await query(
    `SELECT t.Idtiquete, t.numero, t.clase, t.asiento, t.valor, t.estado, ci.pase,
            v.Idvuelo, v.salidaprog, v.llegadaprog, v.estado AS estadovuelo, pr.numerovuelo,
            r.Idorigen, r.Iddestino, CONCAT(c.nombres, ' ', c.apellidos) AS pasajero
       FROM Tiquete t
       JOIN Cliente c ON c.Idcliente = t.Idpasajero
       JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
       JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta
       LEFT JOIN CheckIn ci ON ci.Idtiquete = t.Idtiquete
      WHERE t.Idreserva = ? ORDER BY v.salidaprog`, [re.Idreserva]);
  const pagos = await query('SELECT Idpago, fecha, valor, medio, estado, referencia FROM Pago WHERE Idreserva = ? ORDER BY fecha', [re.Idreserva]);
  const factura = await uno('SELECT * FROM Factura WHERE Idreserva = ?', [re.Idreserva]);
  const pendiente = tiquetes.filter((t) => t.estado === 'R').reduce((s, t) => s + Number(t.valor), 0);
  res.json({ ...re, tiquetes, pagos, factura, porPagar: Math.round(pendiente * 1.1 * 100) / 100 });
}));

// Pagar: la pasarela simulada responde aprobado o rechazado y sp_pagar lo registra
r.post('/reservas/:id/pagar', requiere('PASAJERO'), ah(async (req, res) => {
  const re = await reservaDelPasajero(req.params.id, req.usuario);
  const { estado, referencia } = cobrar(req.body);
  const { idpago, idfactura } = await llamar('sp_pagar', [re.Idreserva, req.body.medio, estado, referencia], ['idpago', 'idfactura']);
  res.json({ estado, referencia, Idpago: idpago, Idfactura: idfactura,
    mensaje: estado === 'A' ? 'Pago aprobado: sus tiquetes fueron emitidos' : 'La pasarela rechazó el pago. Intente con otra tarjeta.' });
}));

export default r;
