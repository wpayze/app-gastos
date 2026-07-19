import type { HTMLAttributes, ReactNode } from "react";
import { formatMoney, formatSigned } from "@/lib/format";
import type { MovementType } from "@/lib/types";

function cx(...cls: Array<string | false | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export { cx };

// ── Card ────────────────────────────────────────────────────

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(27,36,30,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {children}
      </h2>
      {action}
    </div>
  );
}

// ── Cantidades (siempre en mono tabular) ────────────────────

export function Amount({
  value,
  tipo,
  signed = false,
  neutral = false,
  className,
}: {
  value: number;
  tipo?: MovementType;
  /** muestra +/− y colorea según tipo */
  signed?: boolean;
  /** fuerza color de tinta aunque haya tipo */
  neutral?: boolean;
  className?: string;
}) {
  const color =
    neutral || !tipo
      ? undefined
      : tipo === "ingreso"
        ? "text-income"
        : "text-expense";
  return (
    <span className={cx("amount", color, className)}>
      {signed && tipo ? formatSigned(value, tipo) : formatMoney(value)}
    </span>
  );
}

// ── Badge ───────────────────────────────────────────────────

const BADGE_VARIANTS = {
  green: "bg-pine-tint text-pine-deep",
  red: "bg-expense-tint text-expense",
  amber: "bg-amber-tint text-amber",
  gray: "bg-line-soft text-ink-soft",
  outline: "border border-line text-ink-soft",
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export function Badge({
  variant = "gray",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Avatar ──────────────────────────────────────────────────

export function Avatar({
  iniciales,
  color,
  size = 32,
  className,
}: {
  iniciales: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.38,
      }}
    >
      {iniciales}
    </span>
  );
}

// ── Barra de progreso con estados ───────────────────────────

export function ProgressBar({
  pct,
  className,
}: {
  /** 0-100+; >85 ámbar, >100 granate */
  pct: number;
  className?: string;
}) {
  const color =
    pct >= 100 ? "bg-expense" : pct >= 85 ? "bg-amber" : "bg-pine";
  return (
    <div
      className={cx("h-1.5 w-full overflow-hidden rounded-full bg-line-soft", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ── Skeletons ───────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
