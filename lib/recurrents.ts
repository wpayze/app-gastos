// Lógica pura sobre recurrentes — sin Supabase, importable tanto desde
// Server Components (Dashboard, Recurrentes) como desde Client Components
// (para recalcular tras una mutación optimista sin esperar al servidor).

import { isoToMonthKey } from "./calendar";
import type { Movement, Recurrent } from "./types";

/**
 * ¿Este recurrente activo debería tener ya un movimiento este mes y
 * todavía no lo tiene? Sirve tanto para el botón "Agregar a este mes"
 * (por recurrente) como para el aviso del Dashboard (cuántos faltan).
 */
export function isRecurrentPendingForMonth(
  recurrent: Recurrent,
  month: string,
  movementsThisMonth: Movement[],
): boolean {
  if (recurrent.estado !== "activo") return false;
  if (isoToMonthKey(recurrent.fechaInicio) > month) return false;
  if (recurrent.fechaFin && isoToMonthKey(recurrent.fechaFin) < month) return false;
  return !movementsThisMonth.some((m) => m.recurrentId === recurrent.id);
}
