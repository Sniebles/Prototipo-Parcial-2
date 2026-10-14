// Operación de vuelos (Operational Pipeline): tablero del día, estado del vuelo y registro de etapas
// (Electronic Events) con sp_registrar_evento_vuelo.
import express from 'express';
import { query, uno, llamar } from './db.js';
import { requiere } from './auth.js';
import { VUELO_SQL } from './reservas.js';
import { ah, AppError, codigo, fecha, texto } from './util.js';

const r = express.Router();
export const ETAPAS = ['R', 'P', 'C', 'D', 'M', 'L', 'U', 'X'];

// Estado de un vuelo con su línea de tiempo (lo ven el pasajero y el empleado)
r.get('/vuelos/:id/estado', requiere('PASAJERO', 'EMPLEADO'), ah(async (req, res) => {
  const v = await uno(`${VUELO_SQL} WHERE v.Idvuelo = ?`, [req.params.id]);
  if (!v) throw new AppError(404, 'El vuelo no existe');
  const eventos = await query(
    `SELECT ev.Idevento, ev.etapa, ev.fecha, ev.descripcion, CONCAT(e.nombres, ' ', e.apellidos) AS empleado
       FROM EventoVuelo ev LEFT JOIN Empleado e ON e.Idempleado = ev.Idempleado
      WHERE ev.Idvuelo = ? ORDER BY ev.fecha`, [v.Idvuelo]);
  const tripulacion = req.usuario.rol === 'EMPLEADO' ? await query(
    `SELECT at.rol, CONCAT(e.nombres, ' ', e.apellidos) AS nombre FROM AsignacionTripulacion at
       JOIN Empleado e ON e.Idempleado = at.Idempleado WHERE at.Idvuelo = ? ORDER BY at.rol DESC`, [v.Idvuelo]) : [];
  res.json({ ...v, eventos, tripulacion });
}));

// Tablero de vuelos del día por aeropuerto de salida
r.get('/operacion/vuelos', requiere('EMPLEADO'), ah(async (req, res) => {
  const aeropuerto = String(req.query.aeropuerto || req.usuario.aeropuerto || 'ATL');
  const dia = fecha(req.query.fecha, 'fecha');
  const filas = await query(
    `SELECT v.Idvuelo, pr.numerovuelo, r.Iddestino, cd.nombre AS ciudaddestino, v.salidaprog, v.llegadaprog,
            v.salidareal, v.estado, pu.codigo AS puerta,
            (SELECT COUNT(*) FROM Tiquete t WHERE t.Idvuelo = v.Idvuelo AND t.estado IN ('E', 'U')) AS pasajeros,
            (SELECT COUNT(*) FROM CheckIn ci JOIN Tiquete t ON t.Idtiquete = ci.Idtiquete WHERE t.Idvuelo = v.Idvuelo) AS checkin,
            (SELECT COUNT(*) FROM Embarque em JOIN Tiquete t ON t.Idtiquete = em.Idtiquete WHERE t.Idvuelo = v.Idvuelo) AS embarcados,
            (SELECT ev.etapa FROM EventoVuelo ev WHERE ev.Idvuelo = v.Idvuelo ORDER BY ev.fecha DESC LIMIT 1) AS ultimaetapa
       FROM Vuelo v
       JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta
       JOIN Aeropuerto ad ON ad.Idaeropuerto = r.Iddestino JOIN Ciudad cd ON cd.Idciudad = ad.Idciudad
       LEFT JOIN Puerta pu ON pu.Idpuerta = v.Idpuerta
      WHERE r.Idorigen = ? AND v.fecha = ?
      ORDER BY v.salidaprog`, [aeropuerto, dia]);
  res.json({ aeropuerto, fecha: dia, data: filas });
}));

// Fechas con vuelos desde un aeropuerto (para ayudar a elegir el día en el tablero)
r.get('/operacion/fechas', requiere('EMPLEADO'), ah(async (req, res) => {
  const aeropuerto = String(req.query.aeropuerto || req.usuario.aeropuerto || 'ATL');
  const filas = await query(
    `SELECT DISTINCT v.fecha FROM Vuelo v JOIN Programacion pr ON pr.Idprogramacion = v.Idprogramacion
       JOIN Ruta r ON r.Idruta = pr.Idruta WHERE r.Idorigen = ? ORDER BY v.fecha`, [aeropuerto]);
  res.json({ data: filas.map((f) => f.fecha) });
}));

// Registrar una etapa del pipeline operacional
r.post('/operacion/vuelos/:id/eventos', requiere('EMPLEADO'), ah(async (req, res) => {
  const etapa = codigo(req.body.etapa, 'etapa', ETAPAS);
  const descripcion = texto(req.body.descripcion, 'descripcion', { max: 100, obligatorio: false });
  await llamar('sp_registrar_evento_vuelo', [req.params.id, etapa, descripcion, req.usuario.id, null]);
  const v = await uno('SELECT estado, salidareal, llegadareal FROM Vuelo WHERE Idvuelo = ?', [req.params.id]);
  res.status(201).json({ ok: true, vuelo: v });
}));

export default r;
