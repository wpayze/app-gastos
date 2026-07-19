// Fecha "actual" fija del entorno MOCK.
// Mantiene los datos estables entre servidor y cliente (sin desajustes de hidratación)
// y hace deterministas los cálculos de "hoy", "próximos" y mes actual.

export const TODAY = "2026-07-19";
export const CURRENT_MONTH = "2026-07";
export const CURRENT_DAY = 19;

export interface MonthOption {
  /** "2026-07" */
  key: string;
  /** "Julio 2026" */
  label: string;
  /** "Jul" */
  short: string;
}

export const MONTHS: MonthOption[] = [
  { key: "2026-02", label: "Febrero 2026", short: "Feb" },
  { key: "2026-03", label: "Marzo 2026", short: "Mar" },
  { key: "2026-04", label: "Abril 2026", short: "Abr" },
  { key: "2026-05", label: "Mayo 2026", short: "May" },
  { key: "2026-06", label: "Junio 2026", short: "Jun" },
  { key: "2026-07", label: "Julio 2026", short: "Jul" },
];

export function monthLabel(key: string) {
  return MONTHS.find((m) => m.key === key)?.label ?? key;
}

export function prevMonthKey(key: string): string | null {
  const i = MONTHS.findIndex((m) => m.key === key);
  return i > 0 ? MONTHS[i - 1].key : null;
}

/** Día del mes (2 dígitos) → fecha ISO dentro de un mes dado */
export function dateInMonth(monthKey: string, day: number) {
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}
