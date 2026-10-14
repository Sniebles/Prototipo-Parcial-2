// Sesión y roles: token JWT en cookie httpOnly. PASAJERO = Cliente; EMPLEADO = Empleado.
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { AppError } from './util.js';

export function iniciarSesion(res, usuario) {
  const token = jwt.sign(usuario, config.jwtSecreto, { expiresIn: '4h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 4 * 60 * 60 * 1000 });
}

export function cerrarSesion(res) {
  res.clearCookie('token');
}

export function cargarUsuario(req, _res, next) {
  const token = req.cookies?.token;
  if (token) {
    try {
      const { id, rol, nombre, aeropuerto, departamento } = jwt.verify(token, config.jwtSecreto);
      req.usuario = { id, rol, nombre, aeropuerto, departamento };
    } catch { /* token vencido o inválido: se ignora */ }
  }
  next();
}

export const requiere = (...roles) => (req, _res, next) => {
  if (!req.usuario) return next(new AppError(401, 'Debe iniciar sesión'));
  if (roles.length && !roles.includes(req.usuario.rol)) return next(new AppError(403, 'No tiene permisos para esta operación'));
  next();
};
