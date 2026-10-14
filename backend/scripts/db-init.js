// Crea las bases delta_oltp y delta_dw ejecutando los scripts de ../../../database en orden,
// prueba las 3 consultas del datawarehouse y cifra la contraseña de los usuarios de prueba (Demo1234*).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config, RUTA_ENV, explicarErrorMySQL } from '../src/config.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database');
const ARCHIVOS = ['01_schema.sql', '02_procedimientos.sql', '03_datos.sql', '04_dw.sql', '05_consultas_dw.sql'];

/** Divide un script en sentencias respetando DELIMITER, comillas y comentarios "--". */
function sentencias(sql) {
  const salida = [];
  let delim = ';';
  let actual = '';
  for (const linea of sql.split(/\r?\n/)) {
    const m = linea.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (m) { delim = m[1]; continue; }
    // quitar comentario "--" que no esté dentro de comillas
    let limpia = '';
    let enComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const ch = linea[i];
      if (ch === "'") enComillas = !enComillas;
      if (!enComillas && ch === '-' && linea[i + 1] === '-' && /\s|$/.test(linea[i + 2] ?? ' ')) break;
      limpia += ch;
    }
    actual += limpia + '\n';
    if (limpia.trimEnd().endsWith(delim)) {
      const s = actual.trimEnd().slice(0, -delim.length).trim();
      if (s) salida.push(s);
      actual = '';
    }
  }
  if (actual.trim()) salida.push(actual.trim());
  return salida;
}

// Verificaciones previas: si algo puede salir mal, que se diga claro y con la solución
if (!fs.existsSync(RUTA_ENV)) {
  console.error(`✖ No existe el archivo ${RUTA_ENV}`);
  console.error('  Debe existir backend/.env con su usuario (DB_USER) y contraseña (DB_PASSWORD) de MySQL.');
  console.error('  Ojo: si lo editó con el Bloc de notas, revise que no haya quedado como ".env.txt".');
  process.exit(1);
}
const faltantes = ARCHIVOS.filter((a) => !fs.existsSync(path.join(dir, a)));
if (faltantes.length) {
  console.error(`✖ No se encontraron los scripts en ${dir}: ${faltantes.join(', ')}`);
  console.error('  No mueva la carpeta prototipo fuera de "Parcial2_Delta": los scripts están en "Parcial2_Delta/database".');
  process.exit(1);
}

let conn;
try {
  conn = await mysql.createConnection({ ...config.db, database: undefined, dateStrings: true });
} catch (e) {
  console.error(`✖ ${explicarErrorMySQL(e)}`);
  process.exit(1);
}
console.log(`Conectado a MySQL como ${config.db.user}. Se van a (re)crear las bases delta_oltp y delta_dw...`);
try {
  for (const archivo of ARCHIVOS) {
    const lista = sentencias(fs.readFileSync(path.join(dir, archivo), 'utf8'));
    const filas = [];
    for (const s of lista) {
      const [r] = await conn.query(s);
      if (archivo === '05_consultas_dw.sql' && Array.isArray(r)) filas.push(r.length);
    }
    const extra = filas.length ? `; consultas 4a, 4b y 4c: ${filas.join(', ')} filas` : '';
    console.log(`✔ ${archivo} (${lista.length} sentencias${extra})`);
  }
  const hash = await bcrypt.hash('Demo1234*', 10);
  await conn.query("UPDATE delta_oltp.Empleado SET clave = ? WHERE clave = 'PENDIENTE'", [hash]);
  await conn.query("UPDATE delta_oltp.Cliente SET clave = ? WHERE clave = 'PENDIENTE'", [hash]);
  console.log('✔ Contraseña de los usuarios de prueba: Demo1234*');
  console.log('Listo. Ahora ejecute: npm run dev');
} catch (e) {
  console.error('✖ Error creando la base de datos:', explicarErrorMySQL(e));
  if (e.sql) console.error('  Sentencia que falló:', e.sql.split('\n')[0].slice(0, 120));
  process.exitCode = 1;
} finally {
  await conn.end();
}
