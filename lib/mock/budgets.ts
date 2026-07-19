import type { Budget } from "../types";

export const BUDGETS: Budget[] = [
  {
    id: "b-personal",
    nombre: "Personal",
    descripcion: "Tus finanzas del día a día",
    emoji: "🪙",
    moneda: "EUR",
    estado: "activo",
    limiteMensual: 2200,
    datosDesde: "2026-02",
    miembros: [
      {
        userId: "u-wil",
        rol: "administrador",
        estado: "activo",
        fechaIncorporacion: "2025-11-02",
        ultimaActividad: "2026-07-18",
      },
    ],
  },
  {
    id: "b-hogar",
    nombre: "Hogar",
    descripcion: "Gastos compartidos de casa",
    emoji: "🏡",
    moneda: "EUR",
    estado: "activo",
    limiteMensual: 3200,
    datosDesde: "2026-02",
    miembros: [
      {
        userId: "u-wil",
        rol: "administrador",
        estado: "activo",
        fechaIncorporacion: "2025-12-10",
        ultimaActividad: "2026-07-18",
      },
      {
        userId: "u-marta",
        rol: "administrador",
        estado: "activo",
        fechaIncorporacion: "2025-12-10",
        ultimaActividad: "2026-07-19",
      },
      {
        userId: "u-diego",
        rol: "editor",
        estado: "activo",
        fechaIncorporacion: "2026-01-22",
        ultimaActividad: "2026-07-16",
      },
      {
        userId: "u-andres",
        rol: "editor",
        estado: "pendiente",
        fechaIncorporacion: "2026-07-14",
        ultimaActividad: "2026-07-14",
      },
    ],
  },
  {
    id: "b-viaje",
    nombre: "Viaje a Japón",
    descripcion: "Ahorro y reservas para octubre",
    emoji: "🗾",
    moneda: "EUR",
    estado: "activo",
    limiteMensual: 1500,
    datosDesde: "2026-06",
    miembros: [
      {
        userId: "u-wil",
        rol: "administrador",
        estado: "activo",
        fechaIncorporacion: "2026-05-28",
        ultimaActividad: "2026-07-15",
      },
      {
        userId: "u-marta",
        rol: "editor",
        estado: "activo",
        fechaIncorporacion: "2026-05-28",
        ultimaActividad: "2026-07-12",
      },
      {
        userId: "u-lucia",
        rol: "lectura",
        estado: "activo",
        fechaIncorporacion: "2026-06-09",
        ultimaActividad: "2026-07-02",
      },
    ],
  },
  {
    id: "b-proyecto",
    nombre: "Proyecto compartido",
    descripcion: "Presupuesto del estudio de diseño",
    emoji: "🚀",
    moneda: "EUR",
    estado: "activo",
    miembros: [
      {
        userId: "u-diego",
        rol: "administrador",
        estado: "activo",
        fechaIncorporacion: "2026-07-05",
        ultimaActividad: "2026-07-17",
      },
      {
        userId: "u-wil",
        rol: "editor",
        estado: "activo",
        fechaIncorporacion: "2026-07-06",
        ultimaActividad: "2026-07-06",
      },
      {
        userId: "u-carolina",
        rol: "lectura",
        estado: "suspendido",
        fechaIncorporacion: "2026-07-08",
        ultimaActividad: "2026-07-09",
      },
    ],
  },
];

export function getBudget(id: string): Budget {
  return BUDGETS.find((b) => b.id === id) ?? BUDGETS[0];
}
