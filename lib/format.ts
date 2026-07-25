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

export function formatPct(value: number) {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("es-ES")} %`;
}

/** Variación relativa entre dos valores, en %. null si no hay base de comparación. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function toUTC(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
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

/**
 * Días de diferencia respecto a `today`: negativo = pasado.
 * `today` se recibe explícito (nunca `new Date()` aquí dentro) porque esta
 * función se llama desde Client Components que también se renderizan en
 * el servidor: si calculara "hoy" por su cuenta, servidor y cliente podrían
 * ver milisegundos distintos y desajustar la hidratación. Quien llama debe
 * fijar `today` una vez arriba (en un Server Component) y pasarlo hacia
 * abajo — igual que hacía el mock con su TODAY fijo.
 */
export function daysFromToday(iso: string, today: string) {
  const ms = toUTC(iso).getTime() - toUTC(today).getTime();
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
