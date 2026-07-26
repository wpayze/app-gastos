import { createClient } from "@/lib/supabase/server";
import { mapActivity } from "@/lib/models/mappers";
import { formatSigned } from "@/lib/format";
import type { ActivityItem, ActivityKind, MovementType } from "@/lib/types";

/**
 * Combina la actividad guardada (miembros, límites, recurrentes) con la
 * actividad de movimientos, que se deriva de la tabla `movements` en vez
 * de duplicarse — igual que hacía el mock.
 *
 * Usa `created_at` (cuándo se registró la fila), no `fecha` (la fecha del
 * gasto/ingreso que elige quien lo crea): un movimiento con fecha pasada
 * introducido hoy es actividad reciente aunque su `fecha` no lo sea.
 */
export async function recentActivity(
  budgetId: string,
  n = 8,
): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [movsResult, activityResult] = await Promise.all([
    supabase
      .from("movements")
      .select("id, tipo, concepto, cantidad, user_id, created_at")
      .eq("budget_id", budgetId)
      .order("created_at", { ascending: false })
      .limit(n),
    supabase
      .from("activity")
      .select("*")
      .eq("budget_id", budgetId)
      .order("fecha", { ascending: false })
      .limit(n),
  ]);
  if (movsResult.error) throw movsResult.error;
  if (activityResult.error) throw activityResult.error;

  const fromMovements: ActivityItem[] = movsResult.data.map((m) => {
    const tipo = m.tipo as MovementType;
    return {
      id: `a-${m.id}`,
      budgetId,
      fecha: m.created_at,
      texto: `añadió ${tipo === "gasto" ? "el gasto" : "el ingreso"} «${m.concepto}» (${formatSigned(m.cantidad, tipo)})`,
      userId: m.user_id,
      tipo: "movimiento" as const,
    };
  });

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
