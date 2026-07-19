"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/components/ui/primitives";

const OPTIONS = [
  {
    tipo: "gasto",
    label: "Nuevo gasto",
    description: "Registra una compra o un pago",
    icon: "arrowDownRight" as const,
    cls: "bg-expense-tint text-expense",
  },
  {
    tipo: "ingreso",
    label: "Nuevo ingreso",
    description: "Registra dinero que entra",
    icon: "arrowUpRight" as const,
    cls: "bg-pine-tint text-pine",
  },
  {
    tipo: "transferencia",
    label: "Nueva transferencia",
    description: "Mueve dinero entre presupuestos",
    icon: "swap" as const,
    cls: "bg-amber-tint text-amber",
  },
];

/** Acción global para crear un movimiento (botón + hoja de opciones) */
export function NewMovementButton({
  variant,
}: {
  variant: "sidebar" | "fab";
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {variant === "sidebar" ? (
        <button onClick={() => setOpen(true)} className="btn-primary w-full">
          <Icon name="plus" size={17} />
          Nuevo movimiento
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Nuevo movimiento"
          className="flex h-13 w-13 -translate-y-4 items-center justify-center rounded-full bg-pine text-white shadow-lg shadow-pine/30 transition-transform active:scale-95"
        >
          <Icon name="plus" size={24} />
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo movimiento">
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.tipo}
              onClick={() => {
                setOpen(false);
                router.push(`/movimientos/nuevo?tipo=${o.tipo}`);
              }}
              className="flex w-full items-center gap-3.5 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:bg-line-soft"
            >
              <span className={cx("rounded-full p-2.5", o.cls)}>
                <Icon name={o.icon} size={18} />
              </span>
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-xs text-ink-soft">
                  {o.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
