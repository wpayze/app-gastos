import { createClient } from "@/lib/supabase/server";
import { mapMovement } from "@/lib/models/mappers";
import type { Database } from "@/lib/supabase/database.types";
import { listCategories, getCategoryLimits } from "./categories.service";
import {
  currentMonthKey,
  isoToMonthKey,
  monthsBetween,
  nextMonthKey,
  prevMonthKey,
  type MonthOption,
} from "@/lib/calendar";
import type {
  CategorySpending,
  MonthSummary,
  Movement,
  MovementType,
  PaymentMethod,
} from "@/lib/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const round2 = (n: number) => Math.round(n * 100) / 100;

async function getBudgetMeta(supabase: SupabaseClient, budgetId: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("limite_mensual, created_at")
    .eq("id", budgetId)
    .single();
  if (error) throw error;
  return data;
}

function monthRange(month: string) {
  return { from: `${month}-01`, to: `${nextMonthKey(month)}-01` };
}

/** Comprobación barata (sin traer filas) de si el presupuesto tiene algún movimiento. */
export async function hasAnyMovements(budgetId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("id")
    .eq("budget_id", budgetId)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

export async function movementsByBudget(budgetId: string): Promise<Movement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("budget_id", budgetId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data.map(mapMovement);
}

export async function getMovementById(id: string): Promise<Movement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMovement(data) : null;
}

export async function movementsByMonth(
  budgetId: string,
  month: string,
): Promise<Movement[]> {
  const supabase = await createClient();
  const { from, to } = monthRange(month);
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("budget_id", budgetId)
    .gte("fecha", from)
    .lt("fecha", to)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data.map(mapMovement);
}

/** Meses con datos disponibles para el selector de mes, desde la creación del presupuesto. */
export async function availableMonths(budgetId: string): Promise<MonthOption[]> {
  const supabase = await createClient();
  const meta = await getBudgetMeta(supabase, budgetId);
  return monthsBetween(isoToMonthKey(meta.created_at), currentMonthKey());
}

export async function monthSummary(
  budgetId: string,
  month: string,
): Promise<MonthSummary> {
  const supabase = await createClient();
  const [meta, movs] = await Promise.all([
    getBudgetMeta(supabase, budgetId),
    movementsByMonth(budgetId, month),
  ]);

  const ingresos = round2(
    movs.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.cantidad, 0),
  );
  const gastos = round2(
    movs.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.cantidad, 0),
  );
  const limite = meta.limite_mensual ?? undefined;

  return {
    month,
    ingresos,
    gastos,
    balance: round2(ingresos - gastos),
    disponible: limite !== undefined ? round2(limite - gastos) : undefined,
    progreso: limite ? (gastos / limite) * 100 : undefined,
    movimientos: movs.length,
    // El mes en que se creó el presupuesto no tiene datos desde el día 1.
    parcial: isoToMonthKey(meta.created_at) === month,
  };
}

export async function prevMonthSummary(
  budgetId: string,
  month: string,
): Promise<MonthSummary | null> {
  const supabase = await createClient();
  const meta = await getBudgetMeta(supabase, budgetId);
  const prev = prevMonthKey(month);
  if (isoToMonthKey(meta.created_at) > prev) return null;
  return monthSummary(budgetId, prev);
}

export async function topExpenses(
  budgetId: string,
  month: string,
  n = 5,
): Promise<Movement[]> {
  const supabase = await createClient();
  const { from, to } = monthRange(month);
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("budget_id", budgetId)
    .eq("tipo", "gasto")
    .gte("fecha", from)
    .lt("fecha", to)
    .order("cantidad", { ascending: false })
    .limit(n);
  if (error) throw error;
  return data.map(mapMovement);
}

export async function categorySpending(
  budgetId: string,
  month: string,
): Promise<CategorySpending[]> {
  const [movs, categories, limits] = await Promise.all([
    movementsByMonth(budgetId, month),
    listCategories(),
    getCategoryLimits(budgetId),
  ]);

  const byCat = new Map<string, { total: number; count: number }>();
  for (const m of movs) {
    if (m.tipo !== "gasto") continue;
    const cur = byCat.get(m.categoriaId) ?? { total: 0, count: 0 };
    cur.total += m.cantidad;
    cur.count += 1;
    byCat.set(m.categoriaId, cur);
  }

  const result: CategorySpending[] = [];
  for (const cat of categories.filter((c) => c.tipo === "gasto")) {
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

/** Categorías cercanas (≥85 %) o por encima (≥100 %) de su límite. */
export async function categoryAlerts(
  budgetId: string,
  month: string,
): Promise<CategorySpending[]> {
  const spending = await categorySpending(budgetId, month);
  return spending.filter((c) => c.pct !== undefined && c.pct >= 85);
}

/** Nº de movimientos creados por cada usuario en un presupuesto. */
export async function movementCountByUser(
  budgetId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("user_id")
    .eq("budget_id", budgetId);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data) counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
  return counts;
}

export interface MovementInput {
  budgetId: string;
  tipo: MovementType;
  concepto: string;
  cantidad: number;
  categoriaId: string;
  fecha: string;
  userId: string;
  metodoPago?: PaymentMethod;
  nota?: string;
  recurrentId?: string;
}

export async function createMovement(input: MovementInput): Promise<Movement> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .insert({
      budget_id: input.budgetId,
      tipo: input.tipo,
      concepto: input.concepto,
      cantidad: input.cantidad,
      category_id: input.categoriaId,
      fecha: input.fecha,
      user_id: input.userId,
      metodo_pago: input.metodoPago ?? null,
      nota: input.nota ?? null,
      recurrent_id: input.recurrentId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapMovement(data);
}

export async function updateMovement(
  id: string,
  input: Partial<Omit<MovementInput, "budgetId">>,
): Promise<Movement> {
  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["movements"]["Update"] = {};
  if (input.tipo !== undefined) patch.tipo = input.tipo;
  if (input.concepto !== undefined) patch.concepto = input.concepto;
  if (input.cantidad !== undefined) patch.cantidad = input.cantidad;
  if (input.categoriaId !== undefined) patch.category_id = input.categoriaId;
  if (input.fecha !== undefined) patch.fecha = input.fecha;
  if (input.userId !== undefined) patch.user_id = input.userId;
  if (input.metodoPago !== undefined) patch.metodo_pago = input.metodoPago;
  if (input.nota !== undefined) patch.nota = input.nota;
  if (input.recurrentId !== undefined) patch.recurrent_id = input.recurrentId;

  const { data, error } = await supabase
    .from("movements")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapMovement(data);
}

export async function deleteMovement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw error;
}
