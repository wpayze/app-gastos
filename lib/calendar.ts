// Utilidades de fecha para datos reales.
// A diferencia de lib/mock/calendar.ts (que fija una fecha de demo para
// tener resultados estables), aquí "hoy" y "mes actual" son la fecha real
// del servidor, y los meses disponibles se calculan desde la creación del
// presupuesto, no de una lista fija.

import type { Frequency } from "./types";

export interface MonthOption {
  /** "2026-07" */
  key: string;
  /** "Julio 2026" */
  label: string;
  /** "Jul" */
  short: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7);
}

export function isoToMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthDate(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

const labelFormat = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortFormat = new Intl.DateTimeFormat("es-ES", {
  month: "short",
  timeZone: "UTC",
});

export function monthLabel(key: string): string {
  return capitalize(labelFormat.format(monthDate(key)));
}

export function monthShort(key: string): string {
  return capitalize(shortFormat.format(monthDate(key)).replace(".", ""));
}

export function prevMonthKey(key: string): string {
  const d = monthDate(key);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function nextMonthKey(key: string): string {
  const d = monthDate(key);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** Fecha ISO (yyyy-mm-dd) + una frecuencia → la siguiente ocurrencia. */
export function addInterval(iso: string, frequency: Frequency): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  switch (frequency) {
    case "semanal":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "quincenal":
      date.setUTCDate(date.getUTCDate() + 14);
      break;
    case "mensual":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case "anual":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Meses desde `fromKey` hasta `toKey`, ambos inclusive, en orden ascendente. */
export function monthsBetween(fromKey: string, toKey: string): MonthOption[] {
  const out: MonthOption[] = [];
  const cur = monthDate(fromKey);
  const end = monthDate(toKey);
  while (cur <= end) {
    const key = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}`;
    out.push({ key, label: monthLabel(key), short: monthShort(key) });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}
