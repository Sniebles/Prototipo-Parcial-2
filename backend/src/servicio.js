// Servicio y millas: casos de atención al cliente (CasoServicio) y cuenta SkyMiles (CuentaMillas).
import express from 'express';
import { query, uno, transaccion, siguienteId } from './db.js';
import { requiere } from './auth.js';
import { ah, AppError, codigo, texto } from './util.js';

const r = express.Router();

r.get('/mis-millas', requiere('PASAJERO'), ah(async (req, res) => {
  const cuenta = await uno('SELECT Idcuenta, numero, nivel, saldo FROM CuentaMillas WHERE Idcliente = ?', [req.usuario.id]);
  if (!cuenta) return res.json({ cuenta: null, movimientos: [] });
  const movimientos = await query(
    `SELECT m.fecha, m.millas, m.tipo, pr.numerovuelo, CONCAT(r.Idorigen, ' → ', r.Iddestino) AS ruta
       FROM MovimientoMillas m
       LEFT JOIN Tiquete t ON t.Idtiquete = m.Idtiquete
       LEFT JOIN Vuelo v ON v.Idvuelo = t.Idvuelo
       LEFT JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       LEFT JOIN Ruta r ON r.Idruta = pr.Idruta
      WHERE m.Idcuenta = ? ORDER BY m.fecha DESC`, [cuenta.Idcuenta]);
  res.json({ cuenta, movimientos });
}));

const CASO_SQL = `
  SELECT cs.Idcaso, cs.fecha, cs.tipo, cs.descripcion, cs.estado, cs.Idvuelo, cs.Idequipaje,
         CONCAT(c.nombres, ' ', c.apellidos) AS cliente, c.email, eq.etiqueta, pr.numerovuelo,
         CONCAT(e.nombres, ' ', e.apellidos) AS empleado
    FROM CasoServicio cs
    JOIN Cliente c ON c.Idcliente = cs.Idcliente
    LEFT JOIN Equipaje eq ON eq.Idequipaje = cs.Idequipaje
    LEFT JOIN Vuelo v ON v.Idvuelo = cs.Idvuelo
    LEFT JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
    LEFT JOIN Empleado e ON e.Idempleado = cs.Idempleado`;

r.get('/mis-casos', requiere('PASAJERO'), ah(async (req, res) => {
  res.json({ data: await query(`${CASO_SQL} WHERE cs.Idcliente = ? ORDER BY cs.fecha DESC`, [req.usuario.id]) });
}));

// Opciones para abrir un caso: vuelos y maletas del pasajero
r.get('/mis-casos/opciones', requiere('PASAJERO'), ah(async (req, res) => {
  const vuelos = await query(
    `SELECT DISTINCT v.Idvuelo, pr.numerovuelo, v.fecha, CONCAT(r.Idorigen, ' → ', r.Iddestino) AS ruta
       FROM Tiquete t JOIN Vuelo v ON v.Idvuelo = t.Idvuelo JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta WHERE t.Idpasajero = ? AND t.estado <> 'C' ORDER BY v.fecha DESC`, [req.usuario.id]);
  const maletas = await query(
    `SELECT eq.Idequipaje, eq.etiqueta, eq.estado FROM Equipaje eq JOIN Tiquete t ON t.Idtiquete = eq.Idtiquete
      WHERE t.Idpasajero = ? ORDER BY eq.etiqueta DESC`, [req.usuario.id]);
  res.json({ vuelos, maletas });
}));

r.post('/mis-casos', requiere('PASAJERO'), ah(async (req, res) => {
  const tipo = codigo(req.body.tipo, 'tipo', ['M', 'V', 'R', 'O']);
  const descripcion = texto(req.body.descripcion, 'descripcion', { min: 10, max: 255 });
  const idvuelo = req.body.Idvuelo || null;
  const idequipaje = req.body.Idequipaje || null;
  if (idvuelo && !await uno('SELECT 1 AS ok FROM Tiquete WHERE Idvuelo = ? AND Idpasajero = ?', [idvuelo, req.usuario.id])) throw new AppError(400, 'Ese vuelo no está en sus tiquetes', 'Idvuelo');
  if (idequipaje && !await uno('SELECT 1 AS ok FROM Equipaje eq JOIN Tiquete t ON t.Idtiquete = eq.Idtiquete WHERE eq.Idequipaje = ? AND t.Idpasajero = ?', [idequipaje, req.usuario.id])) throw new AppError(400, 'Esa maleta no es suya', 'Idequipaje');
  const id = await transaccion(async (conn) => {
    const nuevo = await siguienteId(conn, 'CasoServicio');
    await conn.query(
      `INSERT INTO CasoServicio (Idcaso, fecha, tipo, descripcion, estado, Idcliente, Idempleado, Idequipaje, Idvuelo)
       VALUES (?, NOW(), ?, ?, 'A', ?, NULL, ?, ?)`, [nuevo, tipo, descripcion, req.usuario.id, idequipaje, idvuelo]);
    return nuevo;
  });
  res.status(201).json({ Idcaso: id });
}));

// Empleado: casos de servicio para atender y cerrar
r.get('/operacion/casos', requiere('EMPLEADO'), ah(async (req, res) => {
  const estado = req.query.estado === 'C' ? 'C' : 'A';
  res.json({ data: await query(`${CASO_SQL} WHERE cs.estado = ? ORDER BY cs.fecha`, [estado]) });
}));

r.post('/operacion/casos/:id/cerrar', requiere('EMPLEADO'), ah(async (req, res) => {
  const r1 = await query("UPDATE CasoServicio SET estado = 'C', Idempleado = ? WHERE Idcaso = ? AND estado = 'A'", [req.usuario.id, req.params.id]);
  if (!r1.affectedRows) {
    const existe = await uno('SELECT estado FROM CasoServicio WHERE Idcaso = ?', [req.params.id]);
    throw existe ? new AppError(409, 'El caso ya estaba cerrado') : new AppError(404, 'El caso no existe');
  }
  res.json(await uno(`${CASO_SQL} WHERE cs.Idcaso = ?`, [req.params.id]));
}));

export default r;
