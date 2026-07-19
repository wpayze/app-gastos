import type { Category } from "../types";

export const CATEGORIES: Category[] = [
  // Gastos
  { id: "vivienda", nombre: "Vivienda", tipo: "gasto", emoji: "🏠" },
  { id: "alimentacion", nombre: "Alimentación", tipo: "gasto", emoji: "🛒" },
  { id: "transporte", nombre: "Transporte", tipo: "gasto", emoji: "🚌" },
  { id: "salud", nombre: "Salud", tipo: "gasto", emoji: "🩺" },
  { id: "entretenimiento", nombre: "Entretenimiento", tipo: "gasto", emoji: "🎬" },
  { id: "suscripciones", nombre: "Suscripciones", tipo: "gasto", emoji: "📺" },
  { id: "educacion", nombre: "Educación", tipo: "gasto", emoji: "📚" },
  { id: "viajes", nombre: "Viajes", tipo: "gasto", emoji: "✈️" },
  // Ingresos
  { id: "sueldo", nombre: "Sueldo", tipo: "ingreso", emoji: "💶" },
  { id: "freelance", nombre: "Freelance", tipo: "ingreso", emoji: "🧑‍💻" },
  { id: "inversiones", nombre: "Inversiones", tipo: "ingreso", emoji: "📈" },
  { id: "reembolsos", nombre: "Reembolsos", tipo: "ingreso", emoji: "🧾" },
  { id: "otros-ingresos", nombre: "Otros ingresos", tipo: "ingreso", emoji: "🪙" },
];

export function getCategory(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ?? {
      id,
      nombre: "Sin categoría",
      tipo: "gasto",
      emoji: "🏷️",
    }
  );
}

/**
 * Límites mensuales por categoría, definidos por presupuesto.
 * Solo aplican a categorías de gasto.
 */
export const CATEGORY_LIMITS: Record<string, Record<string, number>> = {
  "b-personal": {
    vivienda: 950,
    alimentacion: 280,
    transporte: 120,
    salud: 150,
    entretenimiento: 120,
    suscripciones: 25,
  },
  "b-hogar": {
    vivienda: 1500,
    alimentacion: 650,
    salud: 200,
    entretenimiento: 160,
    suscripciones: 40,
  },
  "b-viaje": {
    viajes: 1400,
  },
  "b-proyecto": {},
};
