import { createClient } from "@/lib/supabase/server";
import { mapCategory } from "@/lib/models/mappers";
import type { Category, MovementType } from "@/lib/types";

/** Taxonomía global (no pertenece a un presupuesto concreto). */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data.map(mapCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCategory(data) : null;
}

export interface CreateCategoryInput {
  id: string;
  nombre: string;
  tipo: MovementType;
  emoji: string;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return mapCategory(data);
}

export async function updateCategory(
  id: string,
  input: Partial<Pick<CreateCategoryInput, "nombre" | "tipo" | "emoji">>,
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapCategory(data);
}

/** Los movimientos que usaban esta categoría quedan con category_id huérfano a nivel de UI. */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Límite mensual por categoría para un presupuesto: { categoryId: limite }. */
export async function getCategoryLimits(
  budgetId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category_limits")
    .select("*")
    .eq("budget_id", budgetId);
  if (error) throw error;

  const limits: Record<string, number> = {};
  for (const row of data) limits[row.category_id] = row.limite_mensual;
  return limits;
}

export async function setCategoryLimit(
  budgetId: string,
  categoryId: string,
  limiteMensual: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("category_limits")
    .upsert({ budget_id: budgetId, category_id: categoryId, limite_mensual: limiteMensual });
  if (error) throw error;
}

export async function removeCategoryLimit(
  budgetId: string,
  categoryId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("category_limits")
    .delete()
    .eq("budget_id", budgetId)
    .eq("category_id", categoryId);
  if (error) throw error;
}
