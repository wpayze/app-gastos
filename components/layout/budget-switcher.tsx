"use client";

import { useState } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/labels";
import { Sheet } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icon";
import { Badge, cx } from "@/components/ui/primitives";

export function BudgetSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeBudget, activeBudgetId, budgets, setActiveBudgetId, currentUserId } =
    useActiveBudget();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Presupuesto activo: ${activeBudget.nombre}. Cambiar de presupuesto`}
        className={cx(
          "flex items-center gap-2 rounded-full border border-line bg-surface text-left transition-colors hover:border-pine",
          compact ? "px-3 py-1.5" : "w-full rounded-xl px-3.5 py-3",
        )}
      >
        <span className={compact ? "text-base" : "text-xl"}>
          {activeBudget.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cx(
              "block truncate font-semibold",
              compact ? "text-sm" : "text-[15px]",
            )}
          >
            {activeBudget.nombre}
          </span>
          {!compact && (
            <span className="block text-xs text-ink-faint">
              Presupuesto activo
            </span>
          )}
        </span>
        <Icon name="chevronDown" size={16} className="shrink-0 text-ink-faint" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Cambiar de presupuesto">
        <ul className="space-y-2">
          {budgets.map((b) => {
            const rol = b.miembros.find((m) => m.userId === currentUserId)?.rol;
            const active = b.id === activeBudgetId;
            return (
              <li key={b.id}>
                <button
                  onClick={() => {
                    if (!active) {
                      setActiveBudgetId(b.id);
                      toast(`Ahora trabajas en «${b.nombre}»`, "info");
                    }
                    setOpen(false);
                  }}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                    active
                      ? "border-pine bg-pine-tint"
                      : "border-line hover:bg-line-soft",
                  )}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{b.nombre}</span>
                      {rol && (
                        <Badge variant="outline">{ROLE_LABEL[rol]}</Badge>
                      )}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {b.miembros.length === 1
                        ? "Solo tú"
                        : `${b.miembros.length} miembros`}
                    </span>
                  </span>
                  {active && (
                    <Icon name="check" size={18} className="shrink-0 text-pine" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Todo lo que ves en la aplicación pertenece al presupuesto activo.
        </p>
      </Sheet>
    </>
  );
}
