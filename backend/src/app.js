// API REST (rutas -> lógica -> procedimientos/consultas MySQL), organizada como el diagrama de componentes.
import express from 'express';
import cookieParser from 'cookie-parser';
import { cargarUsuario } from './auth.js';
import { manejarErrores } from './util.js';
import cuentas from './cuentas.js';
import reservas from './reservas.js';
import aeropuerto from './aeropuerto.js';
import operacion from './operacion.js';
import servicio from './servicio.js';
import datawarehouse from './datawarehouse.js';

export const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(cargarUsuario);

const api = express.Router();
api.get('/health', (req, res) => res.json({ ok: true }));
api.use(cuentas);        // Cuentas y sesión
api.use(reservas);       // Reservas y pagos (vuelos, reservas, pasarela simulada)
api.use(aeropuerto);     // Aeropuerto (check-in, pase, maletas, embarque)
api.use(operacion);      // Operación de vuelos (tablero y etapas del pipeline)
api.use(servicio);       // Servicio y millas (casos, SkyMiles)
api.use(datawarehouse);  // Datawarehouse (ETL y reportes 4a, 4b, 4c)
app.use('/api/v1', api);

app.use((req, res) => res.status(404).json({ error: { mensaje: 'Recurso no encontrado' } }));
app.use(manejarErrores);
