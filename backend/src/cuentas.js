// Cuentas y sesión: el pasajero entra con su cuenta de Cliente y el empleado con la de Empleado.
import express from 'express';
import bcrypt from 'bcryptjs';
import { query, uno } from './db.js';
import { iniciarSesion, cerrarSesion } from './auth.js';
import { ah, AppError, email } from './util.js';

const r = express.Router();

r.post('/auth/login', ah(async (req, res) => {
  const correo = email(req.body.email);
  const clave = String(req.body.clave ?? '');
  let usuario = null;
  const cli = await uno('SELECT Idcliente, nombres, apellidos, clave FROM Cliente WHERE email = ?', [correo]);
  if (cli && await bcrypt.compare(clave, cli.clave)) {
    usuario = { id: cli.Idcliente, rol: 'PASAJERO', nombre: `${cli.nombres} ${cli.apellidos}` };
  } else {
    const emp = await uno(
      `SELECT e.Idempleado, e.nombres, e.apellidos, e.clave, e.cargo, e.Idaeropuerto, d.nombre AS departamento
         FROM Empleado e JOIN Departamento d ON d.Iddepartamento = e.Iddepartamento WHERE e.email = ?`, [correo]);
    if (emp && await bcrypt.compare(clave, emp.clave)) {
      usuario = { id: emp.Idempleado, rol: 'EMPLEADO', nombre: `${emp.nombres} ${emp.apellidos}`, aeropuerto: emp.Idaeropuerto, departamento: `${emp.cargo} · ${emp.departamento}` };
    }
  }
  if (!usuario) throw new AppError(401, 'Email o contraseña incorrectos');
  iniciarSesion(res, usuario);
  res.json({ usuario });
}));

r.post('/auth/logout', (req, res) => { cerrarSesion(res); res.json({ ok: true }); });

r.get('/auth/me', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: { mensaje: 'Debe iniciar sesión' } });
  res.json({ usuario: req.usuario });
});

// Catálogo de aeropuertos (para buscar vuelos y para el tablero de operaciones)
r.get('/aeropuertos', ah(async (req, res) => {
  res.json({ data: await query(
    `SELECT a.Idaeropuerto, a.nombre, c.nombre AS ciudad, p.nombre AS pais
       FROM Aeropuerto a JOIN Ciudad c ON c.Idciudad = a.Idciudad JOIN Pais p ON p.Idpais = c.Idpais
      ORDER BY p.nombre, c.nombre`) });
}));

export default r;
