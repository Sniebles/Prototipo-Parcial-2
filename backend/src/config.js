import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// El .env se lee siempre desde la carpeta backend, sin importar desde dónde se ejecute el comando
export const RUTA_ENV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: RUTA_ENV });

export const config = {
  puerto: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'delta_oltp',
  },
  dbDw: process.env.DB_NAME_DW || 'delta_dw',
  jwtSecreto: process.env.JWT_SECRET || 'secreto-de-desarrollo',
};

/** Traduce los errores de conexión más comunes a un mensaje con la solución. */
export function explicarErrorMySQL(e) {
  const { host, port, user } = config.db;
  switch (e.code) {
    case 'ECONNREFUSED':
      return `No se pudo conectar a MySQL en ${host}:${port}. Encienda el servicio de MySQL (o MySQL en XAMPP) y revise DB_HOST y DB_PORT en .env.`;
    case 'ER_ACCESS_DENIED_ERROR':
      return `MySQL rechazó el usuario "${user}". Revise DB_USER y DB_PASSWORD en ${RUTA_ENV}.`;
    case 'ER_BAD_DB_ERROR':
      return 'La base de datos delta_oltp (o delta_dw) no existe. Ejecute primero: npm run db:init';
    case 'ENOTFOUND':
      return `No se encontró el servidor "${host}". Revise DB_HOST en .env (normalmente localhost).`;
    default:
      return e.message;
  }
}
