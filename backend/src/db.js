// Componentes "Nervous System DB" (delta_oltp) y "Data Warehouse" (delta_dw): pools MySQL,
// consultas parametrizadas y CALL a los procedimientos de 02_procedimientos.sql y 04_dw.sql.
import mysql from 'mysql2/promise';
import { config } from './config.js';

const base = { ...config.db, connectionLimit: 10, dateStrings: true, decimalNumbers: true };
export const pool = mysql.createPool(base);
export const poolDw = mysql.createPool({ ...base, database: config.dbDw });

export async function query(sql, params = []) {
  const [filas] = await pool.query(sql, params);
  return filas;
}

export async function uno(sql, params = []) {
  const filas = await query(sql, params);
  return filas[0] ?? null;
}

/**
 * Llama un procedimiento almacenado con parámetros de entrada y de salida.
 * llamar('sp_checkin', [idtiquete, 'W', null, null], ['pase']) -> { pase }
 */
export async function llamar(procedimiento, entradas = [], salidas = []) {
  const conn = await pool.getConnection();
  try {
    const marcas = [...entradas.map(() => '?'), ...salidas.map((s) => `@${s}`)].join(', ');
    await conn.query(`CALL ${procedimiento}(${marcas})`, entradas);
    if (!salidas.length) return {};
    const [[fila]] = await conn.query(`SELECT ${salidas.map((s) => `@${s} AS ${s}`).join(', ')}`);
    return fila;
  } finally {
    conn.release();
  }
}

// Tablas a las que el backend les genera identificadores (prefijo + 7 dígitos)
const IDS = { CasoServicio: ['Idcaso', 'CAS'] };

/** Siguiente identificador CHAR(10). Debe usarse dentro de una transacción. */
export async function siguienteId(conn, tabla) {
  const [col, prefijo] = IDS[tabla];
  const [[fila]] = await conn.query(
    `SELECT IFNULL(MAX(CAST(SUBSTRING(${col}, 4) AS UNSIGNED)), 0) + 1 AS n FROM ${tabla} FOR UPDATE`,
  );
  return prefijo + String(fila.n).padStart(7, '0');
}

/** Ejecuta fn(conn) dentro de una transacción. */
export async function transaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
