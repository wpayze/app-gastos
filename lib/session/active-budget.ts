import { cookies } from "next/headers";
import { listBudgets } from "@/lib/services/budgets.service";
import type { Budget } from "@/lib/types";

export const ACTIVE_BUDGET_COOKIE = "active_budget_id";

/**
 * Presupuestos del usuario y cuál está activo. La cookie decide cuál,
 * pero siempre se valida contra los presupuestos reales del usuario —
 * por si perdió acceso a uno o la cookie quedó desactualizada.
 *
 * Si el usuario no pertenece a ningún presupuesto (cuenta recién creada,
 * en esta app sin alta propia), devuelve la lista vacía en vez de lanzar:
 * app/layout.tsx se encarga de mostrar una pantalla acorde, no un error.
 */
export async function getActiveBudgetContext(): Promise<{
  budgets: Budget[];
  activeBudgetId: string;
}> {
  const [cookieStore, budgets] = await Promise.all([
    cookies(),
    listBudgets(),
  ]);

  if (budgets.length === 0) {
    return { budgets: [], activeBudgetId: "" };
  }

  const fromCookie = cookieStore.get(ACTIVE_BUDGET_COOKIE)?.value;
  const activeBudgetId =
    fromCookie && budgets.some((b) => b.id === fromCookie)
      ? fromCookie
      : budgets[0].id;

  return { budgets, activeBudgetId };
}
