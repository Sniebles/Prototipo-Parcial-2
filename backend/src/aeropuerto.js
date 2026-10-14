// Aeropuerto: check-in y pase de abordar (sp_checkin), maletas (sp_registrar_equipaje / sp_rastrear_equipaje)
// y embarque en la puerta (sp_embarcar). Los equipos (kiosco, escáner, lector) son los de la tabla Equipo.
import express from 'express';
import { query, uno, llamar } from './db.js';
import { requiere } from './auth.js';
import { ah, AppError, codigo, numero } from './util.js';

const r = express.Router();

async function tiqueteDelPasajero(id, usuario) {
  const t = await uno('SELECT Idtiquete, Idpasajero, estado FROM Tiquete WHERE Idtiquete = ?', [id]);
  if (!t) throw new AppError(404, 'El tiquete no existe');
  if (usuario.rol === 'PASAJERO' && t.Idpasajero !== usuario.id) throw new AppError(403, 'Este tiquete no es suyo');
  return t;
}
// Equipo de un tipo en un aeropuerto: K kiosco, S escáner, L lector de puerta
const equipo = (aeropuerto, tipo) => uno("SELECT Idequipo FROM Equipo WHERE Idaeropuerto = ? AND tipo = ? AND estado = 'A' LIMIT 1", [aeropuerto, tipo]);

// Check-in web del pasajero
r.post('/tiquetes/:id/checkin', requiere('PASAJERO'), ah(async (req, res) => {
  const t = await tiqueteDelPasajero(req.params.id, req.usuario);
  const { pase } = await llamar('sp_checkin', [t.Idtiquete, 'W', null, null], ['pase']);
  res.status(201).json({ pase });
}));

// Pase de abordar
r.get('/tiquetes/:id/pase', requiere('PASAJERO', 'EMPLEADO'), ah(async (req, res) => {
  const t = await tiqueteDelPasajero(req.params.id, req.usuario);
  const p = await uno(
    `SELECT ci.pase, ci.fecha AS fechacheckin, t.Idtiquete, t.numero, t.clase, t.asiento,
            CONCAT(c.nombres, ' ', c.apellidos) AS pasajero, pr.numerovuelo, v.Idvuelo, v.salidaprog,
            DATE_SUB(v.salidaprog, INTERVAL 40 MINUTE) AS embarque, r.Idorigen, r.Iddestino, pu.codigo AS puerta
       FROM CheckIn ci
       JOIN Tiquete t ON t.Idtiquete = ci.Idtiquete
       JOIN Cliente c ON c.Idcliente = t.Idpasajero
       JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
       JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta
       LEFT JOIN Puerta pu ON pu.Idpuerta = v.Idpuerta
      WHERE ci.Idtiquete = ?`, [t.Idtiquete]);
  if (!p) throw new AppError(404, 'Este tiquete todavía no tiene check-in');
  res.json(p);
}));

// Eventos de una maleta (para el pasajero y para el escaneo)
const eventosMaleta = (idequipaje) => query(
  `SELECT ev.fecha, ev.estado, ev.Idaeropuerto, c.nombre AS ciudad, e.descripcion AS equipo
     FROM EventoEquipaje ev
     JOIN Aeropuerto a ON a.Idaeropuerto = ev.Idaeropuerto JOIN Ciudad c ON c.Idciudad = a.Idciudad
     LEFT JOIN Equipo e ON e.Idequipo = ev.Idequipo
    WHERE ev.Idequipaje = ? ORDER BY ev.fecha`, [idequipaje]);

const MALETA_SQL = `
  SELECT eq.Idequipaje, eq.etiqueta, eq.peso, eq.estado, t.Idtiquete, pr.numerovuelo, v.salidaprog,
         r.Idorigen, r.Iddestino, CONCAT(c.nombres, ' ', c.apellidos) AS pasajero
    FROM Equipaje eq
    JOIN Tiquete t ON t.Idtiquete = eq.Idtiquete
    JOIN Cliente c ON c.Idcliente = t.Idpasajero
    JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
    JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
    JOIN Ruta r ON r.Idruta = pr.Idruta`;

r.get('/mis-maletas', requiere('PASAJERO'), ah(async (req, res) => {
  const maletas = await query(`${MALETA_SQL} WHERE t.Idpasajero = ? ORDER BY v.salidaprog DESC`, [req.usuario.id]);
  for (const m of maletas) m.eventos = await eventosMaleta(m.Idequipaje);
  res.json({ data: maletas });
}));

// --- Empleado: registrar maleta en el mostrador y escanearla en cada punto ---
r.post('/operacion/equipaje', requiere('EMPLEADO'), ah(async (req, res) => {
  const t = await uno(
    `SELECT t.Idtiquete, r.Idorigen FROM Tiquete t JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
       JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion JOIN Ruta r ON r.Idruta = pr.Idruta
      WHERE t.Idtiquete = ? OR t.numero = ?`, [req.body.tiquete, req.body.tiquete]);
  if (!t) throw new AppError(404, 'No existe un tiquete con ese número', 'tiquete');
  const peso = numero(req.body.peso, 'peso', { min: 1, max: 32 });
  const eq = await equipo(t.Idorigen, 'S');
  const { idequipaje } = await llamar('sp_registrar_equipaje', [t.Idtiquete, peso, t.Idorigen, eq?.Idequipo ?? null], ['idequipaje']);
  const m = await uno(`${MALETA_SQL} WHERE eq.Idequipaje = ?`, [idequipaje]);
  res.status(201).json({ ...m, eventos: await eventosMaleta(idequipaje) });
}));

r.get('/operacion/equipaje/:etiqueta', requiere('EMPLEADO'), ah(async (req, res) => {
  const m = await uno(`${MALETA_SQL} WHERE eq.etiqueta = ?`, [req.params.etiqueta.trim().toUpperCase()]);
  if (!m) throw new AppError(404, 'No existe una maleta con esa etiqueta');
  res.json({ ...m, eventos: await eventosMaleta(m.Idequipaje) });
}));

r.post('/operacion/equipaje/:etiqueta/escaneo', requiere('EMPLEADO'), ah(async (req, res) => {
  const m = await uno('SELECT Idequipaje FROM Equipaje WHERE etiqueta = ?', [req.params.etiqueta.trim().toUpperCase()]);
  if (!m) throw new AppError(404, 'No existe una maleta con esa etiqueta');
  const estado = codigo(req.body.estado, 'estado', ['R', 'C', 'T', 'D', 'E', 'P']);
  const aeropuerto = String(req.body.aeropuerto || req.usuario.aeropuerto || '');
  const eq = await equipo(aeropuerto, 'S');
  await llamar('sp_rastrear_equipaje', [m.Idequipaje, estado, aeropuerto, eq?.Idequipo ?? null]);
  const act = await uno(`${MALETA_SQL} WHERE eq.Idequipaje = ?`, [m.Idequipaje]);
  res.json({ ...act, eventos: await eventosMaleta(m.Idequipaje) });
}));

// Embarque: lectura del pase de abordar en la puerta (Gate Reader)
r.post('/operacion/embarque', requiere('EMPLEADO'), ah(async (req, res) => {
  const pase = String(req.body.pase ?? '').trim().toUpperCase();
  const t = await uno(
    `SELECT t.Idtiquete, t.asiento, CONCAT(c.nombres, ' ', c.apellidos) AS pasajero, pr.numerovuelo, r.Idorigen, r.Iddestino
       FROM CheckIn ci JOIN Tiquete t ON t.Idtiquete = ci.Idtiquete JOIN Cliente c ON c.Idcliente = t.Idpasajero
       JOIN Vuelo v ON v.Idvuelo = t.Idvuelo JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta
      WHERE ci.pase = ?`, [pase]);
  if (!t) throw new AppError(404, 'Pase de abordar no encontrado: verifique el código', 'pase');
  const lector = await equipo(t.Idorigen, 'L');
  await llamar('sp_embarcar', [t.Idtiquete, lector?.Idequipo ?? null]);
  res.json({ ...t, mensaje: `${t.pasajero} embarcó en el vuelo ${t.numerovuelo} (silla ${t.asiento})` });
}));

export default r;
