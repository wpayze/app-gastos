"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createBudget, listBudgets } from "@/lib/services/budgets.service";
import { ACTIVE_BUDGET_COOKIE } from "./active-budget";

export interface CreateFirstBudgetState {
  error?: string;
}

/** Cambia el presupuesto activo (validando que el usuario sea miembro). */
export async function setActiveBudget(budgetId: string): Promise<void> {
  const budgets = await listBudgets();
  if (!budgets.some((b) => b.id === budgetId)) {
    throw new Error("No tienes acceso a ese presupuesto.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUDGET_COOKIE, budgetId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // El layout raíz (y por tanto toda la app) lee el presupuesto activo
  // desde esta cookie; sin esto, la página actual seguiría mostrando
  // datos del presupuesto anterior hasta una recarga completa.
  revalidatePath("/", "layout");
}

/**
 * Para cuando el usuario todavía no pertenece a ningún presupuesto:
 * crea el primero y lo deja activo. No hace falta que nadie más lo
 * invite — "sin alta propia" era sobre crear usuarios, no presupuestos.
 */
export async function createFirstBudget(
  _prevState: CreateFirstBudgetState,
  formData: FormData,
): Promise<CreateFirstBudgetState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) {
    return { error: "Ponle un nombre a tu presupuesto." };
  }

  const budget = await createBudget({ nombre });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUDGET_COOKIE, budget.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return {};
}
