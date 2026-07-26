import { createClient } from "@/lib/supabase/server";
import { mapActivity } from "@/lib/models/mappers";
import { formatSigned } from "@/lib/format";
import type { ActivityItem, ActivityKind, MovementType } from "@/lib/types";

interface MovementActivityRow {
  id: string;
  tipo: string;
  concepto: string;
  cantidad: number;
  user_id: string;
  created_at: string;
}

/**
 * La actividad de tipo "movimiento" se deriva de `movements`, no se
 * duplica en la tabla `activity` — usa `created_at` (cuándo se registró
 * la fila), no `fecha` (la fecha del gasto/ingreso que elige quien lo
 * crea): un movimiento con fecha pasada introducido hoy es actividad
 * reciente aunque su `fecha` no lo sea.
 */
function movementToActivity(m: MovementActivityRow, budgetId: string): ActivityItem {
  const tipo = m.tipo as MovementType;
  return {
    id: `a-${m.id}`,
    budgetId,
    fecha: m.created_at,
    texto: `añadió ${tipo === "gasto" ? "el gasto" : "el ingreso"} «${m.concepto}» (${formatSigned(m.cantidad, tipo)})`,
    userId: m.user_id,
    tipo: "movimiento" as const,
  };
}

/** Combina la actividad guardada (miembros, límites, recurrentes) con la de movimientos, para el widget del dashboard. */
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

  const fromMovements = movsResult.data.map((m) => movementToActivity(m, budgetId));
  const extras = activityResult.data.map(mapActivity);

  return [...fromMovements, ...extras]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, n);
}

export interface ActivityPage {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Toda la actividad del presupuesto, paginada, para la página /actividad.
 * Usa la vista `budget_activity` (union de `movements` + `activity`) para
 * que el orden y el recorte de página los haga Postgres — nunca se trae
 * más que una página, aunque el presupuesto tenga millones de filas.
 */
export async function activityByBudget(
  budgetId: string,
  page: number,
  pageSize: number,
): Promise<ActivityPage> {
  const supabase = await createClient();
  const start = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("budget_activity")
    .select("*", { count: "exact" })
    .eq("budget_id", budgetId)
    .order("fecha", { ascending: false })
    .range(start, start + pageSize - 1);
  if (error) throw error;

  const items: ActivityItem[] = data.map((row) => {
    if (row.tipo === "movimiento") {
      return movementToActivity(
        {
          id: row.id.replace(/^a-/, ""),
          tipo: row.movimiento_tipo!,
          concepto: row.concepto!,
          cantidad: row.cantidad!,
          user_id: row.user_id,
          created_at: row.fecha,
        },
        budgetId,
      );
    }
    return {
      id: row.id,
      budgetId,
      fecha: row.fecha,
      texto: row.texto!,
      userId: row.user_id,
      tipo: row.tipo as Exclude<ActivityKind, "movimiento">,
    };
  });

  return { items, total: count ?? 0, page, pageSize };
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
