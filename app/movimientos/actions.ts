"use server";

import { revalidatePath } from "next/cache";
import {
  createMovement,
  updateMovement,
  deleteMovement,
} from "@/lib/services/movements.service";
import { createRecurrent } from "@/lib/services/recurrents.service";
import { getExchangeRate } from "@/lib/services/exchange-rates.service";
import { addInterval } from "@/lib/calendar";
import type {
  ForeignCurrency,
  Frequency,
  MovementType,
  PaymentMethod,
} from "@/lib/types";

export interface MovementFormValues {
  tipo: MovementType;
  /** En euros si `monedaOriginal` no viene informado; si viene, se ignora y se recalcula desde `cantidadOriginal`. */
  cantidad: number;
  concepto: string;
  categoriaId: string;
  fecha: string;
  userId: string;
  metodoPago: PaymentMethod;
  nota?: string;
  /** Presentes solo si se introdujo en dólares/lempiras en vez de euros. */
  monedaOriginal?: ForeignCurrency;
  cantidadOriginal?: number;
}

/** Tasa de cambio actual y monto ya convertido a euros, para el preview antes de guardar. */
export async function previewConversionAction(
  moneda: ForeignCurrency,
  cantidad: number,
): Promise<{ tasa: number; convertido: number }> {
  const tasa = await getExchangeRate(moneda);
  return { tasa, convertido: Math.round(cantidad * tasa * 100) / 100 };
}

/**
 * Si `recurrente` viene informado, crea también el recurrente vinculado:
 * este movimiento es su primera ocurrencia, la próxima cae según la
 * frecuencia elegida. Los recurrentes siempre quedan en euros, aunque el
 * movimiento que los origina se haya introducido en otra moneda.
 */
export async function createMovementAction(
  budgetId: string,
  values: MovementFormValues,
  recurrente?: { frecuencia: Frequency },
) {
  let cantidadEur = values.cantidad;
  let tasaCambio: number | undefined;

  if (values.monedaOriginal && values.cantidadOriginal !== undefined) {
    tasaCambio = await getExchangeRate(values.monedaOriginal);
    cantidadEur = Math.round(values.cantidadOriginal * tasaCambio * 100) / 100;
  }

  let recurrentId: string | undefined;

  if (recurrente) {
    const recurrent = await createRecurrent({
      budgetId,
      tipo: values.tipo,
      nombre: values.concepto,
      cantidad: cantidadEur,
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
    cantidad: cantidadEur,
    categoriaId: values.categoriaId,
    fecha: values.fecha,
    userId: values.userId,
    metodoPago: values.metodoPago,
    nota: values.nota,
    recurrentId,
    monedaOriginal: values.monedaOriginal,
    cantidadOriginal: values.cantidadOriginal,
    tasaCambio,
  });

  revalidatePath("/movimientos");
  if (recurrentId) revalidatePath("/recurrentes");
  return movement;
}

/**
 * Editar un movimiento siempre trabaja en euros — el selector de moneda
 * solo aparece al crear uno nuevo. Si el movimiento se introdujo
 * originalmente en dólares/lempiras, ese dato histórico se conserva tal
 * cual (no se re-convierte al editar el monto en euros).
 */
export async function updateMovementAction(
  id: string,
  values: Partial<Omit<MovementFormValues, "monedaOriginal" | "cantidadOriginal">>,
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
