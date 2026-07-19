import type { ActivityItem } from "../types";

/**
 * Eventos de actividad que no son movimientos (invitaciones, límites,
 * recurrentes). La actividad de movimientos se deriva de MOVEMENTS
 * en lib/data.ts para mantener la consistencia.
 */
export const ACTIVITY_EXTRA: ActivityItem[] = [
  {
    id: "a-p-limite-subs",
    budgetId: "b-personal",
    fecha: "2026-07-01",
    texto: "definió el límite de Suscripciones en 25 €",
    userId: "u-wil",
    tipo: "limite",
  },
  {
    id: "a-p-pausa-curso",
    budgetId: "b-personal",
    fecha: "2026-05-20",
    texto: "pausó el recurrente «Curso de japonés»",
    userId: "u-wil",
    tipo: "recurrente",
  },
  {
    id: "a-h-invita-andres",
    budgetId: "b-hogar",
    fecha: "2026-07-14",
    texto: "invitó a Andrés Rojas como editor",
    userId: "u-marta",
    tipo: "miembro",
  },
  {
    id: "a-h-limite-alim",
    budgetId: "b-hogar",
    fecha: "2026-07-10",
    texto: "cambió el límite de Alimentación a 650 €",
    userId: "u-marta",
    tipo: "limite",
  },
  {
    id: "a-v-anade-lucia",
    budgetId: "b-viaje",
    fecha: "2026-06-09",
    texto: "añadió a Lucía Ortiz con acceso de solo lectura",
    userId: "u-wil",
    tipo: "miembro",
  },
  {
    id: "a-pr-invita-carolina",
    budgetId: "b-proyecto",
    fecha: "2026-07-08",
    texto: "invitó a Carolina Núñez",
    userId: "u-diego",
    tipo: "miembro",
  },
  {
    id: "a-pr-suspende-carolina",
    budgetId: "b-proyecto",
    fecha: "2026-07-09",
    texto: "suspendió el acceso de Carolina Núñez",
    userId: "u-diego",
    tipo: "miembro",
  },
];
