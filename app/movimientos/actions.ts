"use server";

import { revalidatePath } from "next/cache";
import {
  createMovement,
  updateMovement,
  deleteMovement,
} from "@/lib/services/movements.service";
import { createRecurrent } from "@/lib/services/recurrents.service";
import { addInterval } from "@/lib/calendar";
import type { Frequency, MovementType, PaymentMethod } from "@/lib/types";

export interface MovementFormValues {
  tipo: MovementType;
  cantidad: number;
  concepto: string;
  categoriaId: string;
  fecha: string;
  userId: string;
  metodoPago: PaymentMethod;
  nota?: string;
}

/**
 * Si `recurrente` viene informado, crea también el recurrente vinculado:
 * este movimiento es su primera ocurrencia, la próxima cae según la
 * frecuencia elegida.
 */
export async function createMovementAction(
  budgetId: string,
  values: MovementFormValues,
  recurrente?: { frecuencia: Frequency },
) {
  let recurrentId: string | undefined;

  if (recurrente) {
    const recurrent = await createRecurrent({
      budgetId,
      tipo: values.tipo,
      nombre: values.concepto,
      cantidad: values.cantidad,
      categoriaId: values.categoriaId,
      frecuencia: recurrente.frecuencia,
      proximaFecha: addInterval(values.fecha, recurrente.frecuencia),
      fechaInicio: values.fecha,
      userId: values.userId,
      metodoPago: values.metodoPago,
    });
    recurrentId = recurrent.id;
  }

  const movement = await createMovement({
    budgetId,
    tipo: values.tipo,
    concepto: values.concepto,
    cantidad: values.cantidad,
    categoriaId: values.categoriaId,
    fecha: values.fecha,
    userId: values.userId,
    metodoPago: values.metodoPago,
    nota: values.nota,
    recurrentId,
  });

  revalidatePath("/movimientos");
  if (recurrentId) revalidatePath("/recurrentes");
  return movement;
}

export async function updateMovementAction(
  id: string,
  values: Partial<MovementFormValues>,
) {
  const movement = await updateMovement(id, values);
  revalidatePath("/movimientos");
  revalidatePath(`/movimientos/${id}`);
  return movement;
}

export async function deleteMovementAction(id: string) {
  await deleteMovement(id);
  revalidatePath("/movimientos");
}
