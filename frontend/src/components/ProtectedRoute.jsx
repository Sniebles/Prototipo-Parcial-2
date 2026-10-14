import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

/** RNF-01: control de acceso por rol en el cliente (el backend vuelve a verificar con requireAuth). */
export default function ProtectedRoute({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <Loader texto="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/403" replace />;
  return children;
}
