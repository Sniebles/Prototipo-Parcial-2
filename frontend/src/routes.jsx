import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import EmptyState from './components/EmptyState.jsx';
// Customer Experience (portal del pasajero)
import Inicio from './experiencia/Inicio.jsx';
import Login from './experiencia/Login.jsx';
import BuscarVuelos from './experiencia/BuscarVuelos.jsx';
import MisReservas from './experiencia/MisReservas.jsx';
import ReservaDetalle from './experiencia/ReservaDetalle.jsx';
import PaseAbordar from './experiencia/PaseAbordar.jsx';
import EstadoVuelo from './experiencia/EstadoVuelo.jsx';
import MisMaletas from './experiencia/MisMaletas.jsx';
import MisMillas from './experiencia/MisMillas.jsx';
import Atencion from './experiencia/Atencion.jsx';
// Operational Pipeline (portal de empleados)
import Tablero from './operacion/Tablero.jsx';
import VueloOperacion from './operacion/VueloOperacion.jsx';
import Embarque from './operacion/Embarque.jsx';
import Equipaje from './operacion/Equipaje.jsx';
import Casos from './operacion/Casos.jsx';
// Analytics
import Datawarehouse from './analitica/Datawarehouse.jsx';

const P = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <div className="app">
      <Navbar />
      <main className="contenido" id="principal">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vuelos" element={<BuscarVuelos />} />
          <Route path="/reservas" element={P(['PASAJERO'], <MisReservas />)} />
          <Route path="/reservas/:id" element={P(['PASAJERO'], <ReservaDetalle />)} />
          <Route path="/pase/:id" element={P(['PASAJERO'], <PaseAbordar />)} />
          <Route path="/vuelo/:id" element={P(['PASAJERO', 'EMPLEADO'], <EstadoVuelo />)} />
          <Route path="/maletas" element={P(['PASAJERO'], <MisMaletas />)} />
          <Route path="/millas" element={P(['PASAJERO'], <MisMillas />)} />
          <Route path="/atencion" element={P(['PASAJERO'], <Atencion />)} />
          <Route path="/operacion" element={P(['EMPLEADO'], <Tablero />)} />
          <Route path="/operacion/vuelo/:id" element={P(['EMPLEADO'], <VueloOperacion />)} />
          <Route path="/operacion/embarque" element={P(['EMPLEADO'], <Embarque />)} />
          <Route path="/operacion/equipaje" element={P(['EMPLEADO'], <Equipaje />)} />
          <Route path="/operacion/casos" element={P(['EMPLEADO'], <Casos />)} />
          <Route path="/analitica" element={P(['EMPLEADO'], <Datawarehouse />)} />
          <Route path="/403" element={<EmptyState icono="🔒" titulo="No tiene permisos para ver esta página"><Link to="/">Volver al inicio</Link></EmptyState>} />
          <Route path="*" element={<EmptyState icono="🧭" titulo="Página no encontrada"><Link to="/">Volver al inicio</Link></EmptyState>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
