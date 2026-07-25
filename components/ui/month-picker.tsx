"use client";

import type { MonthOption } from "@/lib/calendar";
import { Icon } from "./icon";
import { cx } from "./primitives";

export function MonthPicker({
  months,
  value,
  onChange,
  className,
}: {
  months: MonthOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  const index = months.findIndex((m) => m.key === value);
  const current = months[index];

  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface px-1 py-1",
        className,
      )}
    >
      <button
        aria-label="Mes anterior"
        disabled={index <= 0}
        onClick={() => onChange(months[index - 1].key)}
        className="rounded-full p-1.5 text-ink-soft hover:bg-line-soft disabled:opacity-30"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <span className="min-w-28 text-center text-sm font-semibold">
        {current?.label ?? value}
      </span>
      <button
        aria-label="Mes siguiente"
        disabled={index >= months.length - 1 || index === -1}
        onClick={() => onChange(months[index + 1].key)}
        className="rounded-full p-1.5 text-ink-soft hover:bg-line-soft disabled:opacity-30"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}
