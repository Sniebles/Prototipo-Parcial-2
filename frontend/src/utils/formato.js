// Formatos y etiquetas de los códigos CHAR(1) del modelo físico (punto 3)
const fmtUsd = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
export const usd = (v) => (v === null || v === undefined || v === '' ? '—' : fmtUsd.format(Number(v)));
const fmtNum = new Intl.NumberFormat('es-CO');
export const num = (v) => (v === null || v === undefined || v === '' ? '—' : fmtNum.format(Number(v)));

export function fecha(v, conHora = false) {
  if (!v) return '—';
  const [f, h] = String(v).split(/[ T]/);
  const [a, m, d] = f.split('-').map(Number);
  const txt = new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  return conHora && h ? `${txt} ${h.slice(0, 5)}` : txt;
}
export const hora = (v) => (v ? String(v).split(/[ T]/)[1]?.slice(0, 5) ?? '—' : '—');
export const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const CLASES = { E: 'Económica', P: 'Premium', B: 'Ejecutiva' };
export const MEDIOS_PAGO = { C: 'Tarjeta de crédito', D: 'Tarjeta débito', P: 'PSE' };
export const NIVELES = { B: 'Base', S: 'Plata', G: 'Oro', D: 'Diamante' };
export const TIPOS_CASO = { M: 'Maleta', V: 'Vuelo', R: 'Reembolso', O: 'Otro' };
// Las 8 etapas del pipeline operacional (EventoVuelo.etapa)
export const ETAPAS = [
  ['R', 'Asignar recursos'], ['P', 'Preparar la salida'], ['C', 'Cargar el avión'], ['D', 'Salida y cierre'],
  ['M', 'Monitorear el vuelo'], ['L', 'Llegada y cierre'], ['U', 'Descargar'], ['X', 'Limpieza y servicio'],
];
export const NOMBRE_ETAPA = Object.fromEntries(ETAPAS);

// Estados por entidad: [etiqueta, color]
export const ESTADOS = {
  Reserva: { A: ['Activa (por pagar)', 'azul'], P: ['Pagada', 'verde'], C: ['Cancelada', 'rojo'] },
  Tiquete: { R: ['Reservado', 'azul'], E: ['Emitido', 'verde'], U: ['Usado', 'gris'], C: ['Cancelado', 'rojo'] },
  Pago: { P: ['Pendiente', 'azul'], A: ['Aprobado', 'verde'], R: ['Rechazado', 'rojo'] },
  Vuelo: { P: ['Programado', 'azul'], E: ['Embarcando', 'ambar'], S: ['En vuelo', 'ambar'], A: ['Aterrizado', 'verde'], D: ['Demorado', 'rojo'], C: ['Cancelado', 'rojo'] },
  Equipaje: { R: ['Registrada', 'azul'], C: ['Cargada', 'azul'], T: ['En tránsito', 'ambar'], D: ['Descargada', 'azul'], E: ['Entregada', 'verde'], P: ['Perdida', 'rojo'] },
  Caso: { A: ['Abierto', 'ambar'], C: ['Cerrado', 'verde'] },
};
