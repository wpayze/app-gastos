import { createClient } from "@/lib/supabase/server";
import { mapBudget, mapBudgetMember } from "@/lib/models/mappers";
import type { Budget } from "@/lib/types";
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

/** Crea el presupuesto y añade a quien lo crea como administrador. */
export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) throw new Error("No hay sesión activa.");

  const { data: budgetRow, error: budgetError } = await supabase
    .from("budgets")
    .insert({
      nombre: input.nombre,
      descripcion: input.descripcion ?? "",
      emoji: input.emoji ?? "💰",
      limite_mensual: input.limiteMensual ?? null,
    })
    .select("*")
    .single();
  if (budgetError) throw budgetError;

  const { error: memberError } = await supabase
    .from("budget_members")
    .insert({
      budget_id: budgetRow.id,
      user_id: userId,
      rol: "administrador",
    });
  if (memberError) throw memberError;

  const [budget] = await attachMembers(supabase, [budgetRow]);
  return budget;
}
