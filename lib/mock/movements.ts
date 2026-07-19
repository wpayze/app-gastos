import type { Movement, MovementType, PaymentMethod } from "../types";
import { CURRENT_DAY, CURRENT_MONTH, MONTHS, dateInMonth } from "./calendar";

/**
 * Los movimientos se generan a partir de plantillas mensuales con una
 * variación DETERMINISTA (hash del identificador, nunca Math.random),
 * de modo que los datos son idénticos en cada render y entre pantallas.
 */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Variación estable de ±12 % alrededor de una base */
function vary(base: number, seed: string, spread = 0.12) {
  const f = ((hash(seed) % 201) - 100) / 100; // -1 .. 1
  return Math.round(base * (1 + f * spread) * 100) / 100;
}

interface MovTpl {
  slug: string;
  concepto: string;
  tipo: MovementType;
  categoriaId: string;
  dia: number;
  base: number;
  userId: string;
  /** true → importe exacto todos los meses (recibos fijos) */
  fijo?: boolean;
  metodo?: PaymentMethod;
  nota?: string;
  recurrentId?: string;
  /** Meses en los que existe; por defecto, todos */
  months?: string[];
}

function generate(budgetId: string, tpls: MovTpl[]): Movement[] {
  const out: Movement[] = [];
  for (const t of tpls) {
    const months = t.months ?? MONTHS.map((m) => m.key);
    for (const mk of months) {
      // En el mes en curso solo existen movimientos hasta "hoy"
      if (mk === CURRENT_MONTH && t.dia > CURRENT_DAY) continue;
      out.push({
        id: `m-${budgetId}-${mk}-${t.slug}`,
        budgetId,
        tipo: t.tipo,
        concepto: t.concepto,
        cantidad: t.fijo ? t.base : vary(t.base, `${t.slug}-${mk}`),
        categoriaId: t.categoriaId,
        fecha: dateInMonth(mk, t.dia),
        userId: t.userId,
        metodoPago: t.metodo,
        nota: t.nota,
        recurrentId: t.recurrentId,
      });
    }
  }
  return out;
}

// ── Personal ────────────────────────────────────────────────
const PERSONAL: MovTpl[] = [
  // Ingresos
  { slug: "sueldo", concepto: "Sueldo", tipo: "ingreso", categoriaId: "sueldo", dia: 1, base: 2450, fijo: true, userId: "u-wil", metodo: "transferencia", recurrentId: "r-p-sueldo" },
  { slug: "freelance", concepto: "Ingreso freelance", tipo: "ingreso", categoriaId: "freelance", dia: 15, base: 580, userId: "u-wil", metodo: "transferencia", recurrentId: "r-p-freelance", nota: "Proyecto de branding para Atlas Studio" },
  { slug: "reembolso", concepto: "Devolución de la renta", tipo: "ingreso", categoriaId: "reembolsos", dia: 28, base: 210, fijo: true, userId: "u-wil", metodo: "transferencia", months: ["2026-05"] },
  { slug: "wallapop", concepto: "Venta en Wallapop", tipo: "ingreso", categoriaId: "otros-ingresos", dia: 21, base: 45, userId: "u-wil", metodo: "transferencia", months: ["2026-03", "2026-06"] },

  // Gastos fijos (generados por recurrentes)
  { slug: "renta", concepto: "Renta del piso", tipo: "gasto", categoriaId: "vivienda", dia: 2, base: 850, fijo: true, userId: "u-wil", metodo: "domiciliacion", recurrentId: "r-p-renta" },
  { slug: "gym", concepto: "Gimnasio Metropolitan", tipo: "gasto", categoriaId: "salud", dia: 5, base: 39.9, fijo: true, userId: "u-wil", metodo: "domiciliacion", recurrentId: "r-p-gym" },
  { slug: "netflix", concepto: "Netflix", tipo: "gasto", categoriaId: "suscripciones", dia: 9, base: 12.99, fijo: true, userId: "u-wil", metodo: "tarjeta", recurrentId: "r-p-netflix" },
  { slug: "spotify", concepto: "Spotify", tipo: "gasto", categoriaId: "suscripciones", dia: 11, base: 10.99, fijo: true, userId: "u-wil", metodo: "tarjeta", recurrentId: "r-p-spotify" },
  { slug: "icloud", concepto: "iCloud+", tipo: "gasto", categoriaId: "suscripciones", dia: 17, base: 2.99, fijo: true, userId: "u-wil", metodo: "tarjeta", recurrentId: "r-p-icloud" },
  { slug: "seguro-vida", concepto: "Seguro de vida", tipo: "gasto", categoriaId: "salud", dia: 20, base: 21.5, fijo: true, userId: "u-wil", metodo: "domiciliacion", recurrentId: "r-p-seguro-vida" },
  { slug: "internet", concepto: "Internet fibra 600 Mb", tipo: "gasto", categoriaId: "vivienda", dia: 21, base: 34.9, fijo: true, userId: "u-wil", metodo: "domiciliacion", recurrentId: "r-p-internet" },
  { slug: "curso-jp", concepto: "Curso de japonés", tipo: "gasto", categoriaId: "educacion", dia: 25, base: 45, fijo: true, userId: "u-wil", metodo: "tarjeta", recurrentId: "r-p-curso", months: ["2026-02", "2026-03", "2026-04"] },
  { slug: "hbo", concepto: "HBO Max", tipo: "gasto", categoriaId: "suscripciones", dia: 4, base: 9.99, fijo: true, userId: "u-wil", metodo: "tarjeta", recurrentId: "r-p-hbo", months: ["2026-02", "2026-03", "2026-04"] },

  // Gastos variables
  { slug: "super-1", concepto: "Supermercado Mercadona", tipo: "gasto", categoriaId: "alimentacion", dia: 4, base: 62, userId: "u-wil", metodo: "tarjeta" },
  { slug: "fruteria", concepto: "Frutería del barrio", tipo: "gasto", categoriaId: "alimentacion", dia: 8, base: 24, userId: "u-wil", metodo: "efectivo" },
  { slug: "super-2", concepto: "Supermercado Lidl", tipo: "gasto", categoriaId: "alimentacion", dia: 13, base: 58, userId: "u-wil", metodo: "tarjeta" },
  { slug: "super-3", concepto: "Supermercado Mercadona", tipo: "gasto", categoriaId: "alimentacion", dia: 22, base: 66, userId: "u-wil", metodo: "tarjeta" },
  { slug: "abono", concepto: "Abono transporte", tipo: "gasto", categoriaId: "transporte", dia: 3, base: 42, fijo: true, userId: "u-wil", metodo: "tarjeta" },
  { slug: "taxi", concepto: "Taxi", tipo: "gasto", categoriaId: "transporte", dia: 18, base: 14, userId: "u-wil", metodo: "efectivo" },
  { slug: "gasolina", concepto: "Gasolinera Repsol", tipo: "gasto", categoriaId: "transporte", dia: 24, base: 48, userId: "u-wil", metodo: "tarjeta" },
  { slug: "farmacia", concepto: "Farmacia", tipo: "gasto", categoriaId: "salud", dia: 10, base: 12.5, userId: "u-wil", metodo: "efectivo" },
  { slug: "cena", concepto: "Cena con amigos", tipo: "gasto", categoriaId: "entretenimiento", dia: 7, base: 46, userId: "u-wil", metodo: "tarjeta", nota: "La Bicicleta, a pachas" },
  { slug: "cine", concepto: "Cine Yelmo", tipo: "gasto", categoriaId: "entretenimiento", dia: 14, base: 16.5, userId: "u-wil", metodo: "tarjeta" },
  { slug: "concierto", concepto: "Concierto en Razzmatazz", tipo: "gasto", categoriaId: "entretenimiento", dia: 16, base: 52, userId: "u-wil", metodo: "tarjeta", months: ["2026-04", "2026-07"] },
  { slug: "libro", concepto: "Casa del Libro", tipo: "gasto", categoriaId: "educacion", dia: 12, base: 19.9, userId: "u-wil", metodo: "tarjeta", months: ["2026-02", "2026-04", "2026-06"] },
];

// ── Hogar ───────────────────────────────────────────────────
const HOGAR: MovTpl[] = [
  { slug: "aporte-wil", concepto: "Aportación de Wil", tipo: "ingreso", categoriaId: "otros-ingresos", dia: 1, base: 1200, fijo: true, userId: "u-wil", metodo: "transferencia", recurrentId: "r-h-aporte-wil" },
  { slug: "aporte-marta", concepto: "Aportación de Marta", tipo: "ingreso", categoriaId: "otros-ingresos", dia: 1, base: 1200, fijo: true, userId: "u-marta", metodo: "transferencia", recurrentId: "r-h-aporte-marta" },
  { slug: "aporte-diego", concepto: "Aportación extra de Diego", tipo: "ingreso", categoriaId: "otros-ingresos", dia: 6, base: 150, fijo: true, userId: "u-diego", metodo: "transferencia", months: ["2026-05", "2026-07"] },

  { slug: "hipoteca", concepto: "Hipoteca", tipo: "gasto", categoriaId: "vivienda", dia: 3, base: 1180, fijo: true, userId: "u-marta", metodo: "domiciliacion", recurrentId: "r-h-hipoteca" },
  { slug: "netflix-fam", concepto: "Netflix familiar", tipo: "gasto", categoriaId: "suscripciones", dia: 6, base: 17.99, fijo: true, userId: "u-diego", metodo: "tarjeta", recurrentId: "r-h-netflix" },
  { slug: "seguro-hogar", concepto: "Seguro del hogar", tipo: "gasto", categoriaId: "vivienda", dia: 8, base: 18.75, fijo: true, userId: "u-marta", metodo: "domiciliacion", recurrentId: "r-h-seguro-hogar" },
  { slug: "luz", concepto: "Electricidad Iberdrola", tipo: "gasto", categoriaId: "vivienda", dia: 12, base: 80, userId: "u-marta", metodo: "domiciliacion", recurrentId: "r-h-luz" },
  { slug: "agua", concepto: "Agua", tipo: "gasto", categoriaId: "vivienda", dia: 15, base: 32, userId: "u-wil", metodo: "domiciliacion", recurrentId: "r-h-agua" },
  { slug: "limpieza-1", concepto: "Servicio de limpieza", tipo: "gasto", categoriaId: "vivienda", dia: 10, base: 60, fijo: true, userId: "u-marta", metodo: "efectivo", recurrentId: "r-h-limpieza" },
  { slug: "limpieza-2", concepto: "Servicio de limpieza", tipo: "gasto", categoriaId: "vivienda", dia: 24, base: 60, fijo: true, userId: "u-marta", metodo: "efectivo", recurrentId: "r-h-limpieza" },

  { slug: "super-1", concepto: "Supermercado Alcampo", tipo: "gasto", categoriaId: "alimentacion", dia: 2, base: 128, userId: "u-marta", metodo: "tarjeta" },
  { slug: "super-2", concepto: "Supermercado Alcampo", tipo: "gasto", categoriaId: "alimentacion", dia: 9, base: 115, userId: "u-wil", metodo: "tarjeta" },
  { slug: "super-3", concepto: "Supermercado Mercadona", tipo: "gasto", categoriaId: "alimentacion", dia: 16, base: 122, userId: "u-diego", metodo: "tarjeta" },
  { slug: "super-4", concepto: "Carrefour", tipo: "gasto", categoriaId: "alimentacion", dia: 23, base: 140, userId: "u-marta", metodo: "tarjeta" },
  { slug: "carniceria", concepto: "Carnicería Paco", tipo: "gasto", categoriaId: "alimentacion", dia: 19, base: 34, userId: "u-marta", metodo: "efectivo" },
  { slug: "limpieza-prod", concepto: "Productos de limpieza", tipo: "gasto", categoriaId: "alimentacion", dia: 10, base: 22, userId: "u-wil", metodo: "tarjeta" },
  { slug: "farmacia", concepto: "Farmacia", tipo: "gasto", categoriaId: "salud", dia: 11, base: 18, userId: "u-diego", metodo: "efectivo" },
  { slug: "fisio", concepto: "Fisioterapia", tipo: "gasto", categoriaId: "salud", dia: 17, base: 45, userId: "u-marta", metodo: "tarjeta" },
  { slug: "dentista", concepto: "Dentista", tipo: "gasto", categoriaId: "salud", dia: 20, base: 120, fijo: true, userId: "u-marta", metodo: "tarjeta", months: ["2026-06"], nota: "Empaste y revisión" },
  { slug: "cena-fam", concepto: "Cena familiar La Tagliatella", tipo: "gasto", categoriaId: "entretenimiento", dia: 13, base: 86, userId: "u-wil", metodo: "tarjeta" },
  { slug: "ferreteria", concepto: "Ferretería", tipo: "gasto", categoriaId: "vivienda", dia: 21, base: 28, userId: "u-diego", metodo: "efectivo", months: ["2026-03", "2026-05"] },
];

// ── Viaje a Japón (movimientos puntuales, solo jun–jul) ─────
const VIAJE: Movement[] = [
  { id: "m-b-viaje-2026-06-aporte", budgetId: "b-viaje", tipo: "ingreso", concepto: "Aportación mensual conjunta", cantidad: 500, categoriaId: "otros-ingresos", fecha: "2026-06-03", userId: "u-wil", metodoPago: "transferencia", recurrentId: "r-v-aporte" },
  { id: "m-b-viaje-2026-06-extra-marta", budgetId: "b-viaje", tipo: "ingreso", concepto: "Aportación extra de Marta", cantidad: 300, categoriaId: "otros-ingresos", fecha: "2026-06-05", userId: "u-marta", metodoPago: "transferencia" },
  { id: "m-b-viaje-2026-06-vuelos", budgetId: "b-viaje", tipo: "gasto", concepto: "Vuelos MAD–NRT ida y vuelta", cantidad: 890, categoriaId: "viajes", fecha: "2026-06-18", userId: "u-wil", metodoPago: "tarjeta", nota: "2 pasajeros · salida 12 de octubre" },
  { id: "m-b-viaje-2026-06-guia", budgetId: "b-viaje", tipo: "gasto", concepto: "Guía de Japón", cantidad: 24.9, categoriaId: "viajes", fecha: "2026-06-22", userId: "u-marta", metodoPago: "tarjeta" },
  { id: "m-b-viaje-2026-07-aporte", budgetId: "b-viaje", tipo: "ingreso", concepto: "Aportación mensual conjunta", cantidad: 500, categoriaId: "otros-ingresos", fecha: "2026-07-03", userId: "u-wil", metodoPago: "transferencia", recurrentId: "r-v-aporte" },
  { id: "m-b-viaje-2026-07-ryokan", budgetId: "b-viaje", tipo: "gasto", concepto: "Reserva ryokan en Kioto", cantidad: 320, categoriaId: "viajes", fecha: "2026-07-08", userId: "u-marta", metodoPago: "tarjeta", nota: "3 noches · cancelación gratuita" },
  { id: "m-b-viaje-2026-07-seguro", budgetId: "b-viaje", tipo: "gasto", concepto: "Seguro de viaje", cantidad: 62.4, categoriaId: "viajes", fecha: "2026-07-12", userId: "u-wil", metodoPago: "tarjeta" },
  { id: "m-b-viaje-2026-07-jrpass", budgetId: "b-viaje", tipo: "gasto", concepto: "JR Pass (2 personas)", cantidad: 512, categoriaId: "viajes", fecha: "2026-07-15", userId: "u-wil", metodoPago: "tarjeta", nota: "14 días, canjear al llegar" },
];

// El presupuesto "Proyecto compartido" no tiene movimientos todavía:
// alimenta los estados vacíos de la interfaz.

export const MOVEMENTS: Movement[] = [
  ...generate("b-personal", PERSONAL),
  ...generate("b-hogar", HOGAR),
  ...VIAJE,
].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : a.id.localeCompare(b.id)));
