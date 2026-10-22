import { createClient } from "@/lib/supabase/server";
import { mapPendingMovement } from "@/lib/models/mappers";
import type { PendingMovement, PendingStatus } from "@/lib/types";

export async function pendingMovementsByBudget(
  budgetId: string,
): Promise<PendingMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_movements")
    .select("*")
    .eq("budget_id", budgetId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapPendingMovement);
}

export async function getPendingMovement(id: string): Promise<PendingMovement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_movements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPendingMovement(data) : null;
}

/** Cambia el estado; nunca se borra nada. `userId` queda como quien lo resolvió. */
export async function setPendingStatus(
  id: string,
  estado: PendingStatus,
  opts: { userId: string; movementId?: string },
): Promise<PendingMovement> {
  const supabase = await createClient();
  const resolved = estado !== "pendiente";
  const { data, error } = await supabase
    .from("pending_movements")
    .update({
      estado,
      movement_id: opts.movementId ?? null,
      resolved_by: resolved ? opts.userId : null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapPendingMovement(data);
}
