"use server";

import { revalidatePath } from "next/cache";
import {
  createRecurrent,
  updateRecurrent,
  pauseRecurrent,
  resumeRecurrent,
  deleteRecurrent,
  getRecurrentById,
  type RecurrentInput,
} from "@/lib/services/recurrents.service";
import { createMovement } from "@/lib/services/movements.service";
import { logActivity } from "@/lib/services/activity.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { addInterval } from "@/lib/calendar";

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

/**
 * Crea el movimiento de este recurrente para la fecha elegida y avanza
 * proximaFecha a partir de esa misma fecha (no de la que tenía guardada:
 * el cobro real pudo caer en un día distinto al esperado).
 */
export async function addRecurrentMovementAction(
  recurrentId: string,
  fecha: string,
) {
  const recurrent = await getRecurrentById(recurrentId);
  if (!recurrent) throw new Error("Recurrente no encontrado.");

  const movement = await createMovement({
    budgetId: recurrent.budgetId,
    tipo: recurrent.tipo,
    concepto: recurrent.nombre,
    cantidad: recurrent.cantidad,
    categoriaId: recurrent.categoriaId,
    fecha,
    userId: recurrent.userId,
    metodoPago: recurrent.metodoPago,
    recurrentId: recurrent.id,
  });

  const nextProximaFecha = addInterval(fecha, recurrent.frecuencia);
  const seTermino =
    recurrent.fechaFin !== undefined && nextProximaFecha > recurrent.fechaFin;

  await updateRecurrent(recurrent.id, {
    proximaFecha: nextProximaFecha,
    ...(seTermino ? { estado: "finalizado" as const } : {}),
  });

  revalidatePath("/recurrentes");
  revalidatePath("/movimientos");
  revalidatePath("/");
  return movement;
}
