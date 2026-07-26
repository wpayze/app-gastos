// Tipos principales del dominio.
// Cuando exista backend, estos tipos serán el contrato de la API.

export type MovementType = "ingreso" | "gasto";
export type PaymentMethod =
  | "tarjeta"
  | "efectivo"
  | "transferencia"
  | "domiciliacion";
export type BudgetRole = "administrador" | "editor" | "lectura";
export type MemberStatus = "activo" | "pendiente" | "suspendido";
export type BudgetStatus = "activo" | "archivado";
export type RecurrentStatus = "activo" | "pausado" | "finalizado";
export type Frequency = "semanal" | "quincenal" | "mensual" | "anual";
/** Monedas en las que se puede introducir un movimiento, aparte del euro base. */
export type ForeignCurrency = "USD" | "HNL";

export interface User {
  id: string;
  nombre: string;
  email: string;
  iniciales: string;
  /** Color de avatar (clase o hex), estable por usuario */
  color: string;
}

export interface BudgetMember {
  userId: string;
  rol: BudgetRole;
  estado: MemberStatus;
  /** ISO yyyy-mm-dd */
  fechaIncorporacion: string;
  /** ISO yyyy-mm-dd de la última actividad registrada */
  ultimaActividad: string;
}

export interface Budget {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  moneda: "EUR";
  estado: BudgetStatus;
  /** Presupuesto mensual objetivo (gasto máximo) */
  limiteMensual?: number;
  miembros: BudgetMember[];
  /** Primer mes con datos completos; meses anteriores se muestran como datos parciales */
  datosDesde?: string;
}

export interface Category {
  id: string;
  nombre: string;
  tipo: MovementType;
  emoji: string;
}

export interface Movement {
  id: string;
  budgetId: string;
  tipo: MovementType;
  concepto: string;
  cantidad: number;
  categoriaId: string;
  /** ISO yyyy-mm-dd */
  fecha: string;
  userId: string;
  metodoPago?: PaymentMethod;
  nota?: string;
  /** Presente si el movimiento fue generado por un recurrente */
  recurrentId?: string;
  /**
   * Presentes solo si se introdujo en dólares o lempiras: `cantidad` siempre
   * queda en euros (ya convertido), esto es el dato histórico de cómo se
   * introdujo originalmente y con qué tasa se convirtió.
   */
  monedaOriginal?: ForeignCurrency;
  cantidadOriginal?: number;
  tasaCambio?: number;
}

export interface Recurrent {
  id: string;
  budgetId: string;
  tipo: MovementType;
  nombre: string;
  cantidad: number;
  categoriaId: string;
  frecuencia: Frequency;
  /** ISO yyyy-mm-dd de la próxima ejecución prevista */
  proximaFecha: string;
  estado: RecurrentStatus;
  fechaInicio: string;
  fechaFin?: string;
  userId: string;
  metodoPago?: PaymentMethod;
}

export type ActivityKind = "movimiento" | "miembro" | "limite" | "recurrente";

export interface ActivityItem {
  id: string;
  budgetId: string;
  fecha: string;
  texto: string;
  userId: string;
  tipo: ActivityKind;
}

export interface MonthSummary {
  month: string;
  ingresos: number;
  gastos: number;
  balance: number;
  /** limiteMensual - gastos, si el presupuesto define límite */
  disponible?: number;
  /** % del presupuesto mensual consumido (0-100+) */
  progreso?: number;
  movimientos: number;
  /** true si el mes tiene datos incompletos */
  parcial: boolean;
}

export interface CategorySpending {
  categoria: Category;
  gastado: number;
  limite?: number;
  /** % del límite utilizado, si hay límite */
  pct?: number;
  movimientos: number;
}
