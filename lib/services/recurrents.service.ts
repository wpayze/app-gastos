import { createClient } from "@/lib/supabase/server";
import { mapRecurrent } from "@/lib/models/mappers";
import { todayISO } from "@/lib/calendar";
import type { Database } from "@/lib/supabase/database.types";
import type {
  Frequency,
  MovementType,
  PaymentMethod,
  Recurrent,
  RecurrentStatus,
} from "@/lib/types";

export async function getRecurrentById(id: string): Promise<Recurrent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRecurrent(data) : null;
}

export async function recurrentsByBudget(budgetId: string): Promise<Recurrent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrents")
    .select("*")
    .eq("budget_id", budgetId)
    .order("proxima_fecha", { ascending: true });
  if (error) throw error;
  return data.map(mapRecurrent);
}

export async function upcomingRecurrents(
  budgetId: string,
  n = 5,
): Promise<Recurrent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrents")
    .select("*")
    .eq("budget_id", budgetId)
    .eq("estado", "activo")
    .gte("proxima_fecha", todayISO())
    .order("proxima_fecha", { ascending: true })
    .limit(n);
  if (error) throw error;
  return data.map(mapRecurrent);
}

export interface RecurrentInput {
  budgetId: string;
  tipo: MovementType;
  nombre: string;
  cantidad: number;
  categoriaId: string;
  frecuencia: Frequency;
  proximaFecha: string;
  fechaInicio: string;
  fechaFin?: string;
  userId: string;
  metodoPago?: PaymentMethod;
}

export async function createRecurrent(
  input: RecurrentInput,
): Promise<Recurrent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrents")
    .insert({
      budget_id: input.budgetId,
      tipo: input.tipo,
      nombre: input.nombre,
      cantidad: input.cantidad,
      category_id: input.categoriaId,
      frecuencia: input.frecuencia,
      proxima_fecha: input.proximaFecha,
      fecha_inicio: input.fechaInicio,
      fecha_fin: input.fechaFin ?? null,
      user_id: input.userId,
      metodo_pago: input.metodoPago ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRecurrent(data);
}

export async function updateRecurrent(
  id: string,
  input: Partial<Omit<RecurrentInput, "budgetId">> & { estado?: RecurrentStatus },
): Promise<Recurrent> {
  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["recurrents"]["Update"] = {};
  if (input.tipo !== undefined) patch.tipo = input.tipo;
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.cantidad !== undefined) patch.cantidad = input.cantidad;
  if (input.categoriaId !== undefined) patch.category_id = input.categoriaId;
  if (input.frecuencia !== undefined) patch.frecuencia = input.frecuencia;
  if (input.proximaFecha !== undefined) patch.proxima_fecha = input.proximaFecha;
  if (input.fechaInicio !== undefined) patch.fecha_inicio = input.fechaInicio;
  if (input.fechaFin !== undefined) patch.fecha_fin = input.fechaFin;
  if (input.userId !== undefined) patch.user_id = input.userId;
  if (input.metodoPago !== undefined) patch.metodo_pago = input.metodoPago;
  if (input.estado !== undefined) patch.estado = input.estado;

  const { data, error } = await supabase
    .from("recurrents")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapRecurrent(data);
}

export async function pauseRecurrent(id: string): Promise<Recurrent> {
  return updateRecurrent(id, { estado: "pausado" });
}

export async function resumeRecurrent(id: string): Promise<Recurrent> {
  return updateRecurrent(id, { estado: "activo" });
}

export async function deleteRecurrent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("recurrents").delete().eq("id", id);
  if (error) throw error;
}
