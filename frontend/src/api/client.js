// Cliente HTTP del frontend: fetch con credentials:'include' (cookie httpOnly) y errores uniformes.
export class ApiError extends Error {
  constructor(status, error = {}) {
    super(error.mensaje || 'Error de comunicación con el servidor');
    this.status = status;
    this.codigo = error.codigo || 'ERROR';
    this.detalles = error.detalles || [];
  }

  /** Convierte detalles [{campo, mensaje}] en { campo: mensaje } para los formularios. */
  get erroresCampos() {
    return Object.fromEntries(this.detalles.filter((d) => d.campo).map((d) => [d.campo, d.mensaje]));
  }
}

const BASE = '/api/v1';

function construirUrl(ruta, params) {
  const url = new URL(`${BASE}${ruta}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) url.searchParams.set(k, v);
  });
  return url;
}

async function solicitar(metodo, ruta, { body, params } = {}) {
  let res;
  try {
    res = await fetch(construirUrl(ruta, params), {
      method: metodo,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { codigo: 'SIN_CONEXION', mensaje: 'No hay conexión con el servidor. Verifique que la API esté en ejecución.' });
  }
  const tipo = res.headers.get('content-type') ?? '';
  const datos = tipo.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, datos?.error ?? { mensaje: typeof datos === 'string' && datos ? datos : `Error HTTP ${res.status}` });
  }
  return datos;
}

export const api = {
  get: (ruta, params) => solicitar('GET', ruta, { params }),
  post: (ruta, body = {}) => solicitar('POST', ruta, { body }),
  put: (ruta, body = {}) => solicitar('PUT', ruta, { body }),
  del: (ruta, body) => solicitar('DELETE', ruta, { body }),
};

/** URL absoluta para descargas (CSV) que usan la misma cookie de sesión. */
export const urlApi = (ruta, params) => construirUrl(ruta, params).toString();
