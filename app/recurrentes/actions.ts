"use server";

import { revalidatePath } from "next/cache";
import {
  createRecurrent,
  updateRecurrent,
  pauseRecurrent,
  resumeRecurrent,
  deleteRecurrent,
  type RecurrentInput,
} from "@/lib/services/recurrents.service";
import { logActivity } from "@/lib/services/activity.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";

async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  return user;
}

export async function createRecurrentAction(
  budgetId: string,
  input: Omit<RecurrentInput, "budgetId" | "userId" | "proximaFecha">,
) {
  const user = await requireCurrentUser();
  const recurrent = await createRecurrent({
    ...input,
    budgetId,
    userId: user.id,
    // El primer cobro/ingreso cae en la fecha de inicio; no es un campo
    // del formulario, igual que en el mock.
    proximaFecha: input.fechaInicio,
  });
  revalidatePath("/recurrentes");
  return recurrent;
}

export async function updateRecurrentAction(
  id: string,
  input: Partial<Omit<RecurrentInput, "budgetId" | "userId">>,
) {
  const recurrent = await updateRecurrent(id, input);
  revalidatePath("/recurrentes");
  return recurrent;
}

export async function pauseRecurrentAction(
  id: string,
  budgetId: string,
  nombre: string,
) {
  const user = await requireCurrentUser();
  await pauseRecurrent(id);
  await logActivity(
    budgetId,
    user.id,
    "recurrente",
    `pausó el recurrente «${nombre}»`,
  );
  revalidatePath("/recurrentes");
}

export async function resumeRecurrentAction(
  id: string,
  budgetId: string,
  nombre: string,
) {
  const user = await requireCurrentUser();
  await resumeRecurrent(id);
  await logActivity(
    budgetId,
    user.id,
    "recurrente",
    `reanudó el recurrente «${nombre}»`,
  );
  revalidatePath("/recurrentes");
}

export async function deleteRecurrentAction(id: string) {
  await deleteRecurrent(id);
  revalidatePath("/recurrentes");
}
