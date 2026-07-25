import { createClient } from "@/lib/supabase/server";
import { mapBudget, mapBudgetMember } from "@/lib/models/mappers";
import type { Budget, BudgetRole, BudgetStatus } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

/** Adjunta los miembros (de una query aparte a budget_members) a cada fila de budgets. */
async function attachMembers(
  supabase: SupabaseClient,
  budgetRows: BudgetRow[],
): Promise<Budget[]> {
  if (budgetRows.length === 0) return [];

  const { data: memberRows, error } = await supabase
    .from("budget_members")
    .select("*")
    .in(
      "budget_id",
      budgetRows.map((b) => b.id),
    );
  if (error) throw error;

  return budgetRows.map((row) =>
    mapBudget(
      row,
      memberRows
        .filter((m) => m.budget_id === row.id)
        .map(mapBudgetMember),
    ),
  );
}

/** Presupuestos visibles para el usuario actual (RLS filtra por membresía). */
export async function listBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return attachMembers(supabase, data);
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [budget] = await attachMembers(supabase, [data]);
  return budget;
}

export interface CreateBudgetInput {
  nombre: string;
  descripcion?: string;
  emoji?: string;
  limiteMensual?: number;
}

/**
 * Crea el presupuesto y añade a quien lo crea como administrador, en una
 * sola operación atómica (función de Postgres con security definer: ver
 * supabase/migrations/0002_bootstrap_budget_creation.sql). Insertar esto
 * como dos llamadas sueltas desde aquí no funciona: la política de
 * budget_members exige ya ser administrador del presupuesto, algo
 * imposible para la primera fila de membresía.
 */
export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const supabase = await createClient();

  const { data: budgetRow, error } = await supabase.rpc(
    "create_budget_with_owner",
    {
      p_nombre: input.nombre,
      p_descripcion: input.descripcion ?? "",
      p_emoji: input.emoji ?? "💰",
      p_limite_mensual: input.limiteMensual ?? null,
    },
  );
  if (error) throw error;

  const [budget] = await attachMembers(supabase, [budgetRow]);
  return budget;
}

export interface UpdateBudgetInput {
  nombre?: string;
  descripcion?: string;
  emoji?: string;
  limiteMensual?: number | null;
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["budgets"]["Update"] = {};
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
  if (input.emoji !== undefined) patch.emoji = input.emoji;
  if (input.limiteMensual !== undefined) patch.limite_mensual = input.limiteMensual;

  const { data, error } = await supabase
    .from("budgets")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const [budget] = await attachMembers(supabase, [data]);
  return budget;
}

/** No hay "eliminar" presupuesto de verdad: solo archivar/desarchivar. */
export async function setBudgetEstado(
  id: string,
  estado: BudgetStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ estado })
    .eq("id", id);
  if (error) throw error;
}

// ── Miembros ──────────────────────────────────────────────────

export async function addMember(
  budgetId: string,
  userId: string,
  rol: BudgetRole,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_members")
    .insert({ budget_id: budgetId, user_id: userId, rol, estado: "activo" });
  if (error) throw error;
}

export async function updateMemberRole(
  budgetId: string,
  userId: string,
  rol: BudgetRole,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_members")
    .update({ rol })
    .eq("budget_id", budgetId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setMemberEstado(
  budgetId: string,
  userId: string,
  estado: "activo" | "suspendido",
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_members")
    .update({ estado })
    .eq("budget_id", budgetId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Quita a alguien del presupuesto (o le sirve a uno mismo para salir). */
export async function removeMember(
  budgetId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_members")
    .delete()
    .eq("budget_id", budgetId)
    .eq("user_id", userId);
  if (error) throw error;
}
