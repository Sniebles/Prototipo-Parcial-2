import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Customer Experience (pasajero) y Operational Pipeline + Analytics (empleado)
const ENLACES = {
  PUBLICO: [{ a: '/', t: 'Inicio' }, { a: '/vuelos', t: 'Buscar vuelos' }],
  PASAJERO: [{ a: '/vuelos', t: 'Buscar vuelos' }, { a: '/reservas', t: 'Mis reservas' }, { a: '/maletas', t: 'Mis maletas' }, { a: '/millas', t: 'SkyMiles' }, { a: '/atencion', t: 'Atención al cliente' }],
  EMPLEADO: [{ a: '/operacion', t: 'Vuelos del día' }, { a: '/operacion/embarque', t: 'Embarque' }, { a: '/operacion/equipaje', t: 'Equipaje' }, { a: '/operacion/casos', t: 'Casos' }, { a: '/analitica', t: 'Datawarehouse' }],
};

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const enlaces = ENLACES[usuario?.rol ?? 'PUBLICO'];
  const iniciales = usuario?.nombre?.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const cerrar = () => setAbierto(false);

  return (
    <header className={`navbar${abierto ? ' abierto' : ''}`}>
      <nav className="navbar-interno" aria-label="Principal">
        <Link to="/" className="marca" onClick={cerrar}><img src="/favicon.svg" alt="" /> Delta Air Lines</Link>
        <button type="button" className="btn btn-fantasma btn-sm menu-boton" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>☰ Menú</button>
        <div className="nav-enlaces">
          {enlaces.map((e) => <NavLink key={e.a} to={e.a} end={e.a === '/' || e.a === '/operacion'} onClick={cerrar}>{e.t}</NavLink>)}
        </div>
        <div className="nav-usuario">
          {usuario ? (
            <>
              <span className="avatar" aria-hidden="true">{iniciales}</span>
              <span><strong>{usuario.nombre}</strong><span className="rol">{usuario.rol === 'PASAJERO' ? 'Pasajero' : usuario.departamento}</span></span>
              <button type="button" className="btn btn-fantasma btn-sm" onClick={async () => { await logout(); cerrar(); navegar('/'); }}>Cerrar sesión</button>
            </>
          ) : (
            <Link className="btn btn-primario btn-sm" to="/login" onClick={cerrar}>Iniciar sesión</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
