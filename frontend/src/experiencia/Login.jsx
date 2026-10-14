import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../context/AuthContext.jsx';
import FormField from '../components/FormField.jsx';
import ErrorMensaje from '../components/ErrorMensaje.jsx';

const DEMO = [
  ['sofia.martinez20@correo.test', 'Pasajero'],
  ['mark.lewis@delta.test', 'Agente de embarque (ATL)'],
  ['felipe.gomez@delta.test', 'Operaciones (BOG)'],
  ['natalia.perez@delta.test', 'Servicio al cliente'],
];

export default function Login() {
  const { login } = useAuth();
  const navegar = useNavigate();
  const desde = useLocation().state?.desde;
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true); setError(null);
    try {
      const u = await login(email, clave);
      navegar(desde ?? inicioPorRol(u.rol), { replace: true });
    } catch (err) { setError(err); } finally { setEnviando(false); }
  }

  return (
    <div className="dos-columnas">
      <form className="tarjeta" onSubmit={enviar} noValidate>
        <h1>Iniciar sesión</h1>
        <ErrorMensaje error={error} />
        <FormField etiqueta="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} obligatorio autoComplete="username" />
        <FormField etiqueta="Contraseña" type="password" value={clave} onChange={(e) => setClave(e.target.value)} obligatorio autoComplete="current-password" />
        <button className="btn btn-primario btn-bloque" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <aside className="tarjeta">
        <h3>Usuarios de prueba</h3>
        <p className="suave">Contraseña de todos: <span className="mono">Demo1234*</span></p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {DEMO.map(([e, r]) => (
            <li key={e}><button type="button" className="enlace-boton" onClick={() => { setEmail(e); setClave('Demo1234*'); }}>{e}</button> <span className="suave">· {r}</span></li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
