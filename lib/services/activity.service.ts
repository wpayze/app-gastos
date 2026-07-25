import { createClient } from "@/lib/supabase/server";
import { mapActivity } from "@/lib/models/mappers";
import { movementsByBudget } from "./movements.service";
import { formatSigned } from "@/lib/format";
import type { ActivityItem, ActivityKind } from "@/lib/types";

/**
 * Combina la actividad guardada (miembros, límites, recurrentes) con la
 * actividad de movimientos, que se deriva de la tabla `movements` en vez
 * de duplicarse — igual que hacía el mock.
 */
export async function recentActivity(
  budgetId: string,
  n = 8,
): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [movs, activityResult] = await Promise.all([
    movementsByBudget(budgetId),
    supabase
      .from("activity")
      .select("*")
      .eq("budget_id", budgetId)
      .order("fecha", { ascending: false })
      .limit(n),
  ]);
  if (activityResult.error) throw activityResult.error;

  const fromMovements: ActivityItem[] = movs.slice(0, n).map((m) => ({
    id: `a-${m.id}`,
    budgetId,
    fecha: m.fecha,
    texto: `añadió ${m.tipo === "gasto" ? "el gasto" : "el ingreso"} «${m.concepto}» (${formatSigned(m.cantidad, m.tipo)})`,
    userId: m.userId,
    tipo: "movimiento" as const,
  }));

  const extras = activityResult.data.map(mapActivity);

  return [...fromMovements, ...extras]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, n);
}

/** Registra un evento que no es un movimiento (miembro, límite o recurrente). */
export async function logActivity(
  budgetId: string,
  userId: string,
  tipo: Exclude<ActivityKind, "movimiento">,
  texto: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity").insert({
    budget_id: budgetId,
    user_id: userId,
    tipo,
    texto,
  });
  if (error) throw error;
}
