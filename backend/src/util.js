// Utilidades comunes: errores de la API, manejo async y validaciones sencillas.
export class AppError extends Error {
  constructor(status, mensaje, campo) {
    super(mensaje);
    this.status = status;
    this.campo = campo;
  }
}

export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Convierte errores de MySQL en mensajes claros para el usuario. */
export function manejarErrores(err, req, res, _next) {
  let status = err.status || 500;
  let mensaje = err.message;
  if (err.errno === 1644) { status = 409; } // SIGNAL SQLSTATE '45000' de los procedimientos
  else if (err.errno === 1062) { status = 409; mensaje = 'El registro ya existe'; }
  else if (err.errno === 1451) { status = 409; mensaje = 'No se puede eliminar: tiene registros asociados'; }
  else if (err.errno === 1452) { status = 400; mensaje = 'Referencia inválida a otro registro'; }
  else if (err.code === 'ECONNREFUSED') { status = 503; mensaje = 'No hay conexión con la base de datos MySQL'; }
  else if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_NO_SUCH_TABLE') { status = 503; mensaje = 'La base de datos no está creada. Ejecute npm run db:init en la carpeta backend'; }
  if (status >= 500 && !err.errno) console.error(err);
  const detalles = err.campo ? [{ campo: err.campo, mensaje }] : [];
  res.status(status).json({ error: { mensaje: status === 500 ? 'Error interno del servidor' : mensaje, detalles } });
}

// ---- Validaciones ----
export function texto(v, campo, { min = 1, max = 50, obligatorio = true } = {}) {
  const s = (v ?? '').toString().trim();
  if (!s) { if (obligatorio) throw new AppError(400, 'Este campo es obligatorio', campo); return null; }
  if (s.length < min || s.length > max) throw new AppError(400, `Debe tener entre ${min} y ${max} caracteres`, campo);
  return s;
}
export function numero(v, campo, { min = 0, max = 99999999.99, entero = false } = {}) {
  const n = Number(v);
  if (v === '' || v === null || v === undefined || Number.isNaN(n)) throw new AppError(400, 'Debe ser un número', campo);
  if (entero && !Number.isInteger(n)) throw new AppError(400, 'Debe ser un número entero', campo);
  if (n < min || n > max) throw new AppError(400, `Debe estar entre ${min} y ${max}`, campo);
  return n;
}
export function fecha(v, campo) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? '')) throw new AppError(400, 'Fecha inválida (AAAA-MM-DD)', campo);
  return v;
}
export function codigo(v, campo, permitidos) {
  if (!permitidos.includes(v)) throw new AppError(400, `Valor inválido; use ${permitidos.join(', ')}`, campo);
  return v;
}
export function email(v, campo = 'email') {
  const s = texto(v, campo, { max: 50 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new AppError(400, 'Email inválido', campo);
  return s;
}
export function clave(v, campo = 'clave') {
  const s = (v ?? '').toString();
  if (s.length < 8 || !/[A-Z]/.test(s) || !/\d/.test(s)) throw new AppError(400, 'Mínimo 8 caracteres, con una mayúscula y un número', campo);
  return s;
}
