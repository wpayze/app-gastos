"use server";

import { revalidatePath } from "next/cache";
import { createMovementAction } from "@/app/movimientos/actions";
import {
  getPendingMovement,
  setPendingStatus,
} from "@/lib/services/pending-movements.service";
import type { PendingMovement } from "@/lib/types";

export interface AddPendingValues {
  concepto: string;
  categoriaId: string;
  fecha: string;
  userId: string;
}

/**
 * Convierte el pendiente en un movimiento real (gasto con tarjeta). Si el
 * correo venía en dólares/lempiras, se convierte a euros como en cualquier
 * movimiento nuevo.
 */
export async function addPendingAction(
  id: string,
  values: AddPendingValues,
): Promise<PendingMovement> {
  const pending = await getPendingMovement(id);
  if (!pending) throw new Error("Pendiente no encontrado");
  if (pending.estado === "agregado") throw new Error("Ya se agregó");

  const foreign = pending.moneda !== "EUR";
  const movement = await createMovementAction(pending.budgetId, {
    tipo: "gasto",
    cantidad: pending.cantidad,
    concepto: values.concepto,
    categoriaId: values.categoriaId,
    fecha: values.fecha,
    userId: values.userId,
    metodoPago: "tarjeta",
    nota: pending.asunto ? `Correo del banco: ${pending.asunto}` : undefined,
    monedaOriginal: foreign ? (pending.moneda as "USD" | "HNL") : undefined,
    cantidadOriginal: foreign ? pending.cantidad : undefined,
  });

  const updated = await setPendingStatus(id, "agregado", {
    userId: values.userId,
    movementId: movement.id,
  });
  revalidatePath("/pendientes");
  return updated;
}

export async function skipPendingAction(
  id: string,
  userId: string,
): Promise<PendingMovement> {
  const updated = await setPendingStatus(id, "omitido", { userId });
  revalidatePath("/pendientes");
  return updated;
}

/** Devuelve un omitido a la lista de pendientes. */
export async function restorePendingAction(
  id: string,
  userId: string,
): Promise<PendingMovement> {
  const updated = await setPendingStatus(id, "pendiente", { userId });
  revalidatePath("/pendientes");
  return updated;
}
