"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveBudget, useToast } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/labels";
import type { Budget, MonthSummary } from "@/lib/types";
import {
  archiveBudgetAction,
  createBudgetAction,
  leaveBudgetAction,
  unarchiveBudgetAction,
  updateBudgetAction,
} from "@/app/presupuestos/actions";
import {
  Amount,
  Badge,
  Card,
  ProgressBar,
  cx,
} from "@/components/ui/primitives";
import { ConfirmDialog, Menu, Sheet, type MenuItem } from "@/components/ui/overlays";
import { Field, Input, Textarea } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";

interface BudgetFormValues {
  nombre: string;
  descripcion: string;
  limiteMensual?: number;
}

function BudgetForm({
  initial,
  pending,
  onSubmit,
}: {
  initial?: Budget;
  pending: boolean;
  onSubmit: (values: BudgetFormValues) => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [limite, setLimite] = useState(
    initial?.limiteMensual ? String(initial.limiteMensual) : "",
  );
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) {
          setError("El nombre es obligatorio.");
          return;
        }
        setError("");
        onSubmit({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          limiteMensual: limite ? Number(limite.replace(",", ".")) : undefined,
        });
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-expense-tint px-3 py-2 text-sm font-medium text-expense">
          {error}
        </p>
      )}
      <Field label="Nombre">
        <Input
          placeholder="P. ej. Vacaciones 2027"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Field>
      <Field label="Descripción">
        <Textarea
          rows={2}
          placeholder="Para qué sirve este presupuesto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Field>
      <Field
        label="Presupuesto mensual (opcional)"
        hint="Gasto máximo objetivo del mes. Sirve para las alertas y el progreso."
      >
        <Input
          inputMode="decimal"
          placeholder="0,00 €"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <Icon name="check" size={16} />
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear presupuesto"}
        </button>
      </div>
    </form>
  );
}

export function BudgetsView({
  budgets: initialBudgets,
  activeBudgetId,
  summaries,
  monthLabelText,
}: {
  budgets: Budget[];
  activeBudgetId: string;
  summaries: Array<{ budgetId: string; summary: MonthSummary; hasData: boolean }>;
  monthLabelText: string;
}) {
  const router = useRouter();
  const { setActiveBudgetId, currentUserId } = useActiveBudget();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>();
  const [archiving, setArchiving] = useState<Budget | undefined>();
  const [leaving, setLeaving] = useState<Budget | undefined>();

  const summaryFor = (id: string) =>
    summaries.find((s) => s.budgetId === id) ?? {
      summary: { month: "", ingresos: 0, gastos: 0, balance: 0, movimientos: 0, parcial: false },
      hasData: false,
    };

  const handleSubmit = (values: BudgetFormValues) => {
    startTransition(async () => {
      try {
        if (editing) {
          const updated = await updateBudgetAction(editing.id, values);
          setBudgets((l) => l.map((b) => (b.id === updated.id ? updated : b)));
          toast(`Cambios guardados en «${updated.nombre}»`);
        } else {
          const created = await createBudgetAction(values);
          setBudgets((l) => [...l, created]);
          toast(`Presupuesto «${created.nombre}» creado`);
        }
        setFormOpen(false);
      } catch {
        toast("No se pudo guardar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleArchive = (b: Budget) => {
    setBudgets((l) =>
      l.map((x) => (x.id === b.id ? { ...x, estado: "archivado" } : x)),
    );
    toast(`«${b.nombre}» archivado`, "info");
    startTransition(async () => {
      try {
        await archiveBudgetAction(b.id);
      } catch {
        toast("No se pudo archivar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleUnarchive = (b: Budget) => {
    setBudgets((l) =>
      l.map((x) => (x.id === b.id ? { ...x, estado: "activo" } : x)),
    );
    toast(`«${b.nombre}» desarchivado`);
    startTransition(async () => {
      try {
        await unarchiveBudgetAction(b.id);
      } catch {
        toast("No se pudo desarchivar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleLeave = (b: Budget) => {
    setBudgets((l) => l.filter((x) => x.id !== b.id));
    toast(`Has salido de «${b.nombre}»`, "danger");
    startTransition(async () => {
      try {
        await leaveBudgetAction(b.id);
        router.refresh();
      } catch {
        toast("No se pudo salir del presupuesto.", "danger");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-ink-soft">
            Resumen de {monthLabelText.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Icon name="plus" size={16} />
          Crear presupuesto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {budgets.map((b) => {
          const { summary: s, hasData } = summaryFor(b.id);
          const rol = b.miembros.find((m) => m.userId === currentUserId)?.rol;
          const isAdmin = rol === "administrador";
          const activos = b.miembros.filter((m) => m.estado !== "pendiente").length;
          const isActive = b.id === activeBudgetId;
          const isArchived = b.estado === "archivado";

          const items: MenuItem[] = [];
          if (isAdmin) {
            items.push(
              {
                label: "Editar presupuesto",
                icon: "pencil",
                onClick: () => {
                  setEditing(b);
                  setFormOpen(true);
                },
              },
              {
                label: isArchived ? "Desarchivar" : "Archivar",
                icon: "archive",
                onClick: () =>
                  isArchived ? handleUnarchive(b) : setArchiving(b),
              },
            );
          }
          items.push({
            label: "Salir del presupuesto",
            icon: "logout",
            danger: true,
            onClick: () => setLeaving(b),
          });

          return (
            <Card
              key={b.id}
              className={cx(
                "flex flex-col p-5",
                isActive && "border-pine ring-1 ring-pine",
                isArchived && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{b.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{b.nombre}</h2>
                    {isActive && <Badge variant="green">Activo</Badge>}
                    {isArchived && <Badge variant="gray">Archivado</Badge>}
                  </div>
                  <p className="truncate text-sm text-ink-soft">
                    {b.descripcion}
                  </p>
                </div>
                <Menu label={`Opciones de ${b.nombre}`} items={items} />
              </div>

              {hasData ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs text-ink-soft">Balance del mes</p>
                    <span
                      className={cx(
                        "amount text-2xl font-semibold",
                        s.balance >= 0 ? "text-pine-deep" : "text-expense",
                      )}
                    >
                      {s.balance >= 0 ? "+" : "−"}
                      <Amount
                        value={Math.abs(s.balance)}
                        className="text-2xl font-semibold"
                      />
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-paper px-2 py-2">
                      <p className="text-[11px] text-ink-faint">Ingresos</p>
                      <Amount
                        value={s.ingresos}
                        className="text-[13px] font-semibold text-income"
                      />
                    </div>
                    <div className="rounded-lg bg-paper px-2 py-2">
                      <p className="text-[11px] text-ink-faint">Gastos</p>
                      <Amount
                        value={s.gastos}
                        className="text-[13px] font-semibold text-expense"
                      />
                    </div>
                    <div className="rounded-lg bg-paper px-2 py-2">
                      <p className="text-[11px] text-ink-faint">Disponible</p>
                      <Amount
                        value={s.disponible ?? s.balance}
                        className="text-[13px] font-semibold"
                      />
                    </div>
                  </div>
                  {s.progreso !== undefined && <ProgressBar pct={s.progreso} />}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-paper px-3 py-3 text-center text-sm text-ink-faint">
                  Sin movimientos todavía
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <Icon name="users" size={14} />
                  {activos} {activos === 1 ? "miembro" : "miembros"}
                  {rol && <> · Eres {ROLE_LABEL[rol].toLowerCase()}</>}
                </p>
                {!isActive && !isArchived && (
                  <button
                    onClick={() => {
                      setActiveBudgetId(b.id);
                      toast(`Ahora trabajas en «${b.nombre}»`, "info");
                    }}
                    className="text-sm font-semibold text-pine hover:underline"
                  >
                    Usar este presupuesto
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar «${editing.nombre}»` : "Crear presupuesto"}
      >
        <BudgetForm
          key={editing?.id ?? "new"}
          initial={editing}
          pending={pending}
          onSubmit={handleSubmit}
        />
      </Sheet>

      <ConfirmDialog
        open={Boolean(archiving)}
        onClose={() => setArchiving(undefined)}
        onConfirm={() => archiving && handleArchive(archiving)}
        title="Archivar presupuesto"
        confirmLabel="Archivar"
        danger={false}
        description={
          <>
            <strong>{archiving?.nombre}</strong> dejará de aparecer como
            presupuesto disponible, pero sus datos se conservan y podrás
            desarchivarlo cuando quieras.
          </>
        }
      />

      <ConfirmDialog
        open={Boolean(leaving)}
        onClose={() => setLeaving(undefined)}
        onConfirm={() => leaving && handleLeave(leaving)}
        title="Salir del presupuesto"
        confirmLabel="Salir"
        description={
          <>
            Perderás el acceso a <strong>{leaving?.nombre}</strong> y a todos
            sus movimientos. Alguien con rol de administrador tendría que
            añadirte de nuevo.
          </>
        }
      />
    </div>
  );
}
