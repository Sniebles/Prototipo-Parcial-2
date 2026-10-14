// Pasarela de Pagos simulada (N3-5): no hay integración real. Decide si el pago se aprueba.
// Tarjeta que termina en 0002 -> rechazada; cualquier otra válida -> aprobada. PSE siempre aprueba.
import crypto from 'node:crypto';
import { AppError } from './util.js';

export function cobrar({ medio, tarjeta }) {
  if (!['C', 'D', 'P'].includes(medio)) throw new AppError(400, 'Medio de pago inválido (C, D o P)', 'medio');
  let aprobado = true;
  if (medio !== 'P') {
    const num = String(tarjeta ?? '').replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(num)) throw new AppError(400, 'Número de tarjeta inválido', 'tarjeta');
    aprobado = !num.endsWith('0002');
  }
  const referencia = `REF-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  return { estado: aprobado ? 'A' : 'R', referencia };
}
