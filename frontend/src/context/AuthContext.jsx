// Sesión en el cliente (el token vive en una cookie httpOnly; aquí solo se guarda el perfil)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try { setUsuario((await api.get('/auth/me')).usuario); } catch { setUsuario(null); } finally { setCargando(false); }
  }, []);
  useEffect(() => { refrescar(); }, [refrescar]);

  const login = useCallback(async (email, clave) => {
    const r = await api.post('/auth/login', { email, clave });
    setUsuario(r.usuario);
    return r.usuario;
  }, []);
  const logout = useCallback(async () => { try { await api.post('/auth/logout'); } finally { setUsuario(null); } }, []);

  const valor = useMemo(() => ({ usuario, cargando, login, logout, refrescar }), [usuario, cargando, login, logout, refrescar]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function inicioPorRol(rol) {
  return { PASAJERO: '/reservas', EMPLEADO: '/operacion' }[rol] ?? '/';
}
