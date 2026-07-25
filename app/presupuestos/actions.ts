"use server";

import { revalidatePath } from "next/cache";
import {
  createBudget,
  updateBudget,
  setBudgetEstado,
  removeMember,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from "@/lib/services/budgets.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";

function revalidateAll() {
  revalidatePath("/presupuestos");
  // El presupuesto activo y la lista del selector viven en el layout raíz.
  revalidatePath("/", "layout");
}

export async function createBudgetAction(input: CreateBudgetInput) {
  const budget = await createBudget(input);
  revalidateAll();
  return budget;
}

export async function updateBudgetAction(
  id: string,
  input: UpdateBudgetInput,
) {
  const budget = await updateBudget(id, input);
  revalidateAll();
  return budget;
}

export async function archiveBudgetAction(id: string) {
  await setBudgetEstado(id, "archivado");
  revalidateAll();
}

export async function unarchiveBudgetAction(id: string) {
  await setBudgetEstado(id, "activo");
  revalidateAll();
}

/** Salir del presupuesto: quita al usuario actual de sus miembros. */
export async function leaveBudgetAction(budgetId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  await removeMember(budgetId, user.id);
  revalidateAll();
}
