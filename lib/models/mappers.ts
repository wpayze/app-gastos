// Traducción entre filas de Postgres (snake_case, columnas `text` sueltas)
// y los modelos de dominio de lib/types.ts (camelCase, uniones literales).
//
// Este es el único lugar donde se estrechan los `string` planos de
// database.types.ts a las uniones literales del dominio (MovementType,
// BudgetRole, etc.) — si una fila trajera un valor fuera del check
// constraint (no debería, pero la DB no lo impide a nivel de tipos de TS),
// el cast asume que la base de datos ya validó el valor.

import type { Database } from "@/lib/supabase/database.types";
import type {
  ActivityItem,
  Budget,
  BudgetMember,
  Category,
  Movement,
  Recurrent,
  User,
} from "@/lib/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetMemberRow = Database["public"]["Tables"]["budget_members"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type RecurrentRow = Database["public"]["Tables"]["recurrents"]["Row"];
type MovementRow = Database["public"]["Tables"]["movements"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    iniciales: row.iniciales,
    color: row.color,
  };
}

export function mapBudgetMember(row: BudgetMemberRow): BudgetMember {
  return {
    userId: row.user_id,
    rol: row.rol as BudgetMember["rol"],
    estado: row.estado as BudgetMember["estado"],
    fechaIncorporacion: row.fecha_incorporacion,
    ultimaActividad: row.ultima_actividad,
  };
}

/**
 * Combina la fila de `budgets` con sus miembros ya mapeados (vienen de una
 * query aparte a `budget_members`, no de un join automático).
 */
export function mapBudget(row: BudgetRow, miembros: BudgetMember[]): Budget {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    emoji: row.emoji,
    moneda: row.moneda as Budget["moneda"],
    estado: row.estado as Budget["estado"],
    limiteMensual: row.limite_mensual ?? undefined,
    miembros,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo as Category["tipo"],
    emoji: row.emoji,
  };
}

export function mapRecurrent(row: RecurrentRow): Recurrent {
  return {
    id: row.id,
    budgetId: row.budget_id,
    tipo: row.tipo as Recurrent["tipo"],
    nombre: row.nombre,
    cantidad: row.cantidad,
    categoriaId: row.category_id,
    frecuencia: row.frecuencia as Recurrent["frecuencia"],
    proximaFecha: row.proxima_fecha,
    estado: row.estado as Recurrent["estado"],
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin ?? undefined,
    userId: row.user_id,
    metodoPago: (row.metodo_pago as Recurrent["metodoPago"]) ?? undefined,
  };
}

export function mapMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    budgetId: row.budget_id,
    tipo: row.tipo as Movement["tipo"],
    concepto: row.concepto,
    cantidad: row.cantidad,
    categoriaId: row.category_id,
    fecha: row.fecha,
    userId: row.user_id,
    metodoPago: (row.metodo_pago as Movement["metodoPago"]) ?? undefined,
    nota: row.nota ?? undefined,
    recurrentId: row.recurrent_id ?? undefined,
  };
}

/**
 * Solo cubre eventos que no son movimientos (miembro/límite/recurrente).
 * La actividad de tipo "movimiento" se deriva de la tabla `movements` en
 * el servicio, no de esta tabla — ver el diseño en 0001_init.sql.
 */
export function mapActivity(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    budgetId: row.budget_id,
    fecha: row.fecha,
    texto: row.texto,
    userId: row.user_id,
    tipo: row.tipo as ActivityItem["tipo"],
  };
}
