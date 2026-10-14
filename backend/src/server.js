import fs from 'node:fs';
import { app } from './app.js';
import { config, RUTA_ENV, explicarErrorMySQL } from './config.js';
import { pool } from './db.js';

if (!fs.existsSync(RUTA_ENV)) {
  console.warn(`⚠ No existe ${RUTA_ENV}. Créelo (ver README) con su usuario y contraseña de MySQL.`);
}

const servidor = app.listen(config.puerto, async () => {
  console.log(`API de Delta en http://localhost:${config.puerto}/api/v1`);
  try {
    await pool.query('SELECT 1 FROM Vuelo LIMIT 1');
    console.log('✔ Conectado a la base de datos delta_oltp');
  } catch (e) {
    console.error(`✖ Base de datos: ${explicarErrorMySQL(e)}`);
  }
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`✖ El puerto ${config.puerto} ya está en uso. Cierre la otra ventana donde está corriendo la API (o el programa que usa ese puerto) y vuelva a intentar.`);
    process.exit(1);
  }
  throw e;
});
