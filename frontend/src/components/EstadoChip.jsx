import { ESTADOS } from '../utils/formato.js';

export default function EstadoChip({ entidad, estado }) {
  const [texto, color] = ESTADOS[entidad]?.[estado] ?? [estado ?? '—', 'gris'];
  return <span className={`chip chip-${color}`}>{texto}</span>;
}
