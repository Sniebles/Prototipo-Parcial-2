import { Link } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../context/AuthContext.jsx';

// Página de entrada: los tres frentes del diagrama de arquitectura de Delta
export default function Inicio() {
  const { usuario } = useAuth();
  return (
    <div className="pila">
      <section className="tarjeta" style={{ background: 'linear-gradient(120deg, #13307F 0%, var(--color-primario) 55%, var(--color-secundario) 100%)', color: '#fff', border: 0 }}>
        <h1>Sistema de información de Delta Air Lines</h1>
        <p style={{ maxWidth: 680, opacity: 0.92 }}>
          Prototipo de extremo a extremo: el pasajero busca, reserva, paga, hace check-in y sigue su vuelo y sus maletas;
          los empleados registran las etapas del pipeline operacional; y la analítica consulta el datawarehouse.
        </p>
        <div className="fila">
          <Link className="btn btn-secundario" to="/vuelos">Buscar vuelos</Link>
          {usuario ? <Link className="btn btn-fantasma" style={{ color: '#fff' }} to={inicioPorRol(usuario.rol)}>Ir a mi portal</Link>
            : <Link className="btn btn-fantasma" style={{ color: '#fff' }} to="/login">Iniciar sesión</Link>}
        </div>
      </section>
      <div className="grid grid-3">
        <div className="tarjeta"><h3>Customer Experience</h3><p className="suave">Reservas, pago con pasarela simulada, check-in y pase de abordar, estado del vuelo, rastreo de maletas, SkyMiles y atención al cliente.</p></div>
        <div className="tarjeta"><h3>Operational Pipeline</h3><p className="suave">Tablero de vuelos por aeropuerto, registro de las 8 etapas (eventos), embarque con lector de puerta y escaneo de equipaje.</p></div>
        <div className="tarjeta"><h3>Analytics</h3><p className="suave">Carga del datawarehouse (ETL) y los reportes 4a, 4b y 4c por mes, ciudad y pasajero.</p></div>
      </div>
    </div>
  );
}
