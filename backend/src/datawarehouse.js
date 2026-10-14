// Datawarehouse (Analytics): ejecuta el ETL sp_cargar_dw y las consultas 4a, 4b y 4c de 05_consultas_dw.sql
// sobre delta_dw. Cada consulta devuelve una fila por ciudad (o pasajero) con los 12 meses como columnas.
import express from 'express';
import { poolDw } from './db.js';
import { requiere } from './auth.js';
import { ah, AppError } from './util.js';

const r = express.Router();
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const REPORTES = {
  a: {
    titulo: '4a. Ingresos por venta de tiquetes por mes y ciudad (USD)',
    sql: `SELECT c.ciudad, c.pais,
       SUM(CASE WHEN t.mes = 1 THEN h.ingreso ELSE 0 END) AS ene,
       SUM(CASE WHEN t.mes = 2 THEN h.ingreso ELSE 0 END) AS feb,
       SUM(CASE WHEN t.mes = 3 THEN h.ingreso ELSE 0 END) AS mar,
       SUM(CASE WHEN t.mes = 4 THEN h.ingreso ELSE 0 END) AS abr,
       SUM(CASE WHEN t.mes = 5 THEN h.ingreso ELSE 0 END) AS may,
       SUM(CASE WHEN t.mes = 6 THEN h.ingreso ELSE 0 END) AS jun,
       SUM(CASE WHEN t.mes = 7 THEN h.ingreso ELSE 0 END) AS jul,
       SUM(CASE WHEN t.mes = 8 THEN h.ingreso ELSE 0 END) AS ago,
       SUM(CASE WHEN t.mes = 9 THEN h.ingreso ELSE 0 END) AS sep,
       SUM(CASE WHEN t.mes = 10 THEN h.ingreso ELSE 0 END) AS oct,
       SUM(CASE WHEN t.mes = 11 THEN h.ingreso ELSE 0 END) AS nov,
       SUM(CASE WHEN t.mes = 12 THEN h.ingreso ELSE 0 END) AS dic,
       COALESCE(SUM(h.ingreso), 0) AS total
  FROM Dim_Ciudad c
  LEFT JOIN (Hecho_VentaTiquete h
             JOIN Dim_Tiempo t ON t.Idtiempo = h.Idtiempo AND t.anio = ?)
         ON h.Idciudad = c.Idciudad
 GROUP BY c.Idciudad, c.ciudad, c.pais
 ORDER BY total DESC, c.ciudad`,
  },
  b: {
    titulo: '4b. Reservaciones hechas por los clientes por mes y ciudad',
    sql: `SELECT c.ciudad, c.pais,
       SUM(CASE WHEN t.mes = 1 THEN h.reservas ELSE 0 END) AS ene,
       SUM(CASE WHEN t.mes = 2 THEN h.reservas ELSE 0 END) AS feb,
       SUM(CASE WHEN t.mes = 3 THEN h.reservas ELSE 0 END) AS mar,
       SUM(CASE WHEN t.mes = 4 THEN h.reservas ELSE 0 END) AS abr,
       SUM(CASE WHEN t.mes = 5 THEN h.reservas ELSE 0 END) AS may,
       SUM(CASE WHEN t.mes = 6 THEN h.reservas ELSE 0 END) AS jun,
       SUM(CASE WHEN t.mes = 7 THEN h.reservas ELSE 0 END) AS jul,
       SUM(CASE WHEN t.mes = 8 THEN h.reservas ELSE 0 END) AS ago,
       SUM(CASE WHEN t.mes = 9 THEN h.reservas ELSE 0 END) AS sep,
       SUM(CASE WHEN t.mes = 10 THEN h.reservas ELSE 0 END) AS oct,
       SUM(CASE WHEN t.mes = 11 THEN h.reservas ELSE 0 END) AS nov,
       SUM(CASE WHEN t.mes = 12 THEN h.reservas ELSE 0 END) AS dic,
       COALESCE(SUM(h.reservas), 0) AS total
  FROM Dim_Ciudad c
  LEFT JOIN (Hecho_Reserva h
             JOIN Dim_Tiempo t ON t.Idtiempo = h.Idtiempo AND t.anio = ?)
         ON h.Idciudad = c.Idciudad
 GROUP BY c.Idciudad, c.ciudad, c.pais
 ORDER BY total DESC, c.ciudad`,
  },
  c: {
    titulo: '4c. Millas acumuladas por pasajero en vuelos nacionales por mes',
    sql: `SELECT p.Idpasajero, p.nombre, p.nivelmillas,
       SUM(CASE WHEN t.mes = 1 THEN h.millas ELSE 0 END) AS ene,
       SUM(CASE WHEN t.mes = 2 THEN h.millas ELSE 0 END) AS feb,
       SUM(CASE WHEN t.mes = 3 THEN h.millas ELSE 0 END) AS mar,
       SUM(CASE WHEN t.mes = 4 THEN h.millas ELSE 0 END) AS abr,
       SUM(CASE WHEN t.mes = 5 THEN h.millas ELSE 0 END) AS may,
       SUM(CASE WHEN t.mes = 6 THEN h.millas ELSE 0 END) AS jun,
       SUM(CASE WHEN t.mes = 7 THEN h.millas ELSE 0 END) AS jul,
       SUM(CASE WHEN t.mes = 8 THEN h.millas ELSE 0 END) AS ago,
       SUM(CASE WHEN t.mes = 9 THEN h.millas ELSE 0 END) AS sep,
       SUM(CASE WHEN t.mes = 10 THEN h.millas ELSE 0 END) AS oct,
       SUM(CASE WHEN t.mes = 11 THEN h.millas ELSE 0 END) AS nov,
       SUM(CASE WHEN t.mes = 12 THEN h.millas ELSE 0 END) AS dic,
       SUM(h.millas) AS total
  FROM Hecho_Millas h
  JOIN Dim_Tiempo t   ON t.Idtiempo = h.Idtiempo AND t.anio = ?
  JOIN Dim_Ruta r     ON r.Idruta = h.Idruta AND r.nacional = 'S'
  JOIN Dim_Pasajero p ON p.Idpasajero = h.Idpasajero
 GROUP BY p.Idpasajero, p.nombre, p.nivelmillas
 ORDER BY total DESC, p.nombre`,
  },
};

// Cargar (o recargar) el datawarehouse desde delta_oltp
r.post('/dw/cargar', requiere('EMPLEADO'), ah(async (req, res) => {
  const [resultados] = await poolDw.query('CALL sp_cargar_dw()');
  const conteo = Array.isArray(resultados[0]) ? resultados[0][0] : resultados[0];
  res.json({ ok: true, conteo });
}));

r.get('/dw/anios', requiere('EMPLEADO'), ah(async (req, res) => {
  const [filas] = await poolDw.query('SELECT DISTINCT anio FROM Dim_Tiempo ORDER BY anio');
  res.json({ data: filas.map((f) => f.anio) });
}));

r.get('/dw/reportes/:req', requiere('EMPLEADO'), ah(async (req, res) => {
  const rep = REPORTES[req.params.req];
  if (!rep) throw new AppError(404, 'Reporte no encontrado (use a, b o c)');
  const anio = Number(req.query.anio) || new Date().getFullYear();
  const [filas] = await poolDw.query(rep.sql, [anio]);
  res.json({ titulo: rep.titulo, anio, meses: MESES, data: filas });
}));

export default r;
