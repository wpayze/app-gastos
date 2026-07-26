import type { ForeignCurrency } from "./types";

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const moneyInt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact && Math.abs(value) >= 1000 && value % 1 === 0) {
    return moneyInt.format(value);
  }
  return money.format(value);
}

/** "+1.234,56 €" / "−1.234,56 €" según tipo o signo */
export function formatSigned(value: number, tipo: "ingreso" | "gasto") {
  const sign = tipo === "ingreso" ? "+" : "−";
  return `${sign}${money.format(Math.abs(value))}`;
}

const FOREIGN_CURRENCY_SYMBOL: Record<ForeignCurrency, string> = {
  USD: "US$",
  HNL: "L",
};

/** Monto en su moneda original (USD/HNL) sin convertir, para mostrar junto al valor ya convertido a euros. */
export function formatForeignMoney(value: number, moneda: ForeignCurrency) {
  const amount = value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${FOREIGN_CURRENCY_SYMBOL[moneda]} ${amount}`;
}

/**
 * Tasa de cambio (EUR por unidad) con más decimales que `formatMoney`:
 * para monedas de valor pequeño (p. ej. el Lempira, ~0,03 €) dos
 * decimales redondearían la tasa a algo irreconocible.
 */
export function formatRate(value: number) {
  return `${value.toLocaleString("es-ES", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })} €`;
}

export function formatPct(value: number) {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("es-ES")} %`;
}

/** Variación relativa entre dos valores, en %. null si no hay base de comparación. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Acepta tanto fechas simples ("2026-07-25", columnas `date`) como
 * timestamps completos ("2026-07-25T14:23:00+00:00", columnas
 * `timestamptz` como budget_members.ultima_actividad) — a una fecha
 * simple hay que ponerle hora antes de parsearla; a un timestamp que ya
 * la trae, no.
 */
function toUTC(iso: string) {
  return new Date(iso.includes("T") ? iso : `${iso}T00:00:00Z`);
}

const dayMonth = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dayMonthYear = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const longDate = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const weekdayDay = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  return dayMonthYear.format(toUTC(iso));
}

export function formatDateShort(iso: string) {
  return dayMonth.format(toUTC(iso));
}

export function formatDateLong(iso: string) {
  return longDate.format(toUTC(iso));
}

export function formatWeekdayDay(iso: string) {
  return weekdayDay.format(toUTC(iso));
}

function startOfUTCDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Días de diferencia respecto a `today`: negativo = pasado.
 * `today` se recibe explícito (nunca `new Date()` aquí dentro) porque esta
 * función se llama desde Client Components que también se renderizan en
 * el servidor: si calculara "hoy" por su cuenta, servidor y cliente podrían
 * ver milisegundos distintos y desajustar la hidratación. Quien llama debe
 * fijar `today` una vez arriba (en un Server Component) y pasarlo hacia
 * abajo — igual que hacía el mock con su TODAY fijo.
 *
 * Compara días de calendario, no el instante exacto: `iso` puede traer
 * hora (p. ej. `created_at` de un movimiento) y sin truncar a medianoche
 * un evento de esta misma tarde redondeaba a "mañana".
 */
export function daysFromToday(iso: string, today: string) {
  const ms = startOfUTCDay(toUTC(iso)) - startOfUTCDay(toUTC(today));
  return Math.round(ms / 86_400_000);
}

/** "Hoy", "Mañana", "En 5 días", "Hace 3 días" o fecha corta */
export function relativeDay(iso: string, today: string) {
  const d = daysFromToday(iso, today);
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  if (d === -1) return "Ayer";
  if (d > 1 && d <= 14) return `En ${d} días`;
  if (d < -1 && d >= -14) return `Hace ${-d} días`;
  return formatDateShort(iso);
}
