// Capa de acceso a datos.
// Hoy lee del sistema MOCK; cuando exista backend, estas funciones
// se convertirán en llamadas a la API manteniendo la misma firma.

import type {
  ActivityItem,
  Budget,
  CategorySpending,
  MonthSummary,
  Movement,
  Recurrent,
} from "./types";
import { BUDGETS, getBudget } from "./mock/budgets";
import { CATEGORIES, CATEGORY_LIMITS, getCategory } from "./mock/categories";
import { MOVEMENTS } from "./mock/movements";
import { RECURRENTS } from "./mock/recurrents";
import { ACTIVITY_EXTRA } from "./mock/activity";
import { TODAY, MONTHS, prevMonthKey } from "./mock/calendar";
import { formatSigned } from "./format";

export { getBudget, getCategory, CATEGORIES, BUDGETS, CATEGORY_LIMITS };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function listBudgets(): Budget[] {
  return BUDGETS;
}

export function movementsByBudget(budgetId: string): Movement[] {
  return MOVEMENTS.filter((m) => m.budgetId === budgetId);
}

export function getMovement(id: string): Movement | undefined {
  return MOVEMENTS.find((m) => m.id === id);
}

export function movementsByMonth(budgetId: string, month: string): Movement[] {
  return MOVEMENTS.filter(
    (m) => m.budgetId === budgetId && m.fecha.startsWith(month),
  );
}

/** Meses con datos disponibles para un presupuesto (para el selector de mes) */
export function availableMonths(budgetId: string) {
  const budget = getBudget(budgetId);
  return MONTHS.filter((m) => !budget.datosDesde || m.key >= budget.datosDesde);
}

export function monthSummary(budgetId: string, month: string): MonthSummary {
  const budget = getBudget(budgetId);
  const movs = movementsByMonth(budgetId, month);
  const ingresos = round2(
    movs.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.cantidad, 0),
  );
  const gastos = round2(
    movs.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.cantidad, 0),
  );
  const limite = budget.limiteMensual;
  return {
    month,
    ingresos,
    gastos,
    balance: round2(ingresos - gastos),
    disponible: limite !== undefined ? round2(limite - gastos) : undefined,
    progreso: limite ? (gastos / limite) * 100 : undefined,
    movimientos: movs.length,
    parcial: budget.datosDesde !== undefined && month < budget.datosDesde,
  };
}

export function prevMonthSummary(
  budgetId: string,
  month: string,
): MonthSummary | null {
  const prev = prevMonthKey(month);
  if (!prev) return null;
  const budget = getBudget(budgetId);
  if (budget.datosDesde && prev < budget.datosDesde) return null;
  return monthSummary(budgetId, prev);
}

export function topExpenses(
  budgetId: string,
  month: string,
  n = 5,
): Movement[] {
  return movementsByMonth(budgetId, month)
    .filter((m) => m.tipo === "gasto")
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, n);
}

export function categorySpending(
  budgetId: string,
  month: string,
): CategorySpending[] {
  const movs = movementsByMonth(budgetId, month).filter(
    (m) => m.tipo === "gasto",
  );
  const limits = CATEGORY_LIMITS[budgetId] ?? {};
  const byCat = new Map<string, { total: number; count: number }>();
  for (const m of movs) {
    const cur = byCat.get(m.categoriaId) ?? { total: 0, count: 0 };
    cur.total += m.cantidad;
    cur.count += 1;
    byCat.set(m.categoriaId, cur);
  }
  const result: CategorySpending[] = [];
  for (const cat of CATEGORIES.filter((c) => c.tipo === "gasto")) {
    const entry = byCat.get(cat.id);
    const limite = limits[cat.id];
    if (!entry && limite === undefined) continue;
    const gastado = round2(entry?.total ?? 0);
    result.push({
      categoria: cat,
      gastado,
      limite,
      pct: limite ? (gastado / limite) * 100 : undefined,
      movimientos: entry?.count ?? 0,
    });
  }
  return result.sort((a, b) => b.gastado - a.gastado);
}

/** Categorías cercanas (≥85 %) o por encima (≥100 %) de su límite */
export function categoryAlerts(budgetId: string, month: string) {
  return categorySpending(budgetId, month).filter(
    (c) => c.pct !== undefined && c.pct >= 85,
  );
}

export function recurrentsByBudget(budgetId: string): Recurrent[] {
  return RECURRENTS.filter((r) => r.budgetId === budgetId);
}

export function upcomingRecurrents(budgetId: string, n = 5): Recurrent[] {
  return RECURRENTS.filter(
    (r) =>
      r.budgetId === budgetId && r.estado === "activo" && r.proximaFecha >= TODAY,
  )
    .sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha))
    .slice(0, n);
}

export function recentActivity(budgetId: string, n = 8): ActivityItem[] {
  const fromMovements: ActivityItem[] = movementsByBudget(budgetId)
    .slice(0, 6)
    .map((m) => ({
      id: `a-${m.id}`,
      budgetId,
      fecha: m.fecha,
      texto: `añadió ${m.tipo === "gasto" ? "el gasto" : "el ingreso"} «${m.concepto}» (${formatSigned(m.cantidad, m.tipo)})`,
      userId: m.userId,
      tipo: "movimiento" as const,
    }));
  const extras = ACTIVITY_EXTRA.filter((a) => a.budgetId === budgetId);
  return [...fromMovements, ...extras]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, n);
}

/** Nº de movimientos creados por cada usuario en un presupuesto */
export function movementCountByUser(budgetId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of movementsByBudget(budgetId)) {
    counts[m.userId] = (counts[m.userId] ?? 0) + 1;
  }
  return counts;
}
