"use client";

import { useState } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import { listBudgets, monthSummary, movementsByBudget } from "@/lib/data";
import { CURRENT_MONTH, monthLabel } from "@/lib/mock/calendar";
import { ROLE_LABEL } from "@/lib/labels";
import type { Budget } from "@/lib/types";
import {
  Amount,
  Badge,
  Card,
  ProgressBar,
  Skeleton,
  cx,
} from "@/components/ui/primitives";
import { ConfirmDialog, Menu, Sheet } from "@/components/ui/overlays";
import { Field, Input, Textarea } from "@/components/ui/forms";
import { Icon } from "@/components/ui/icon";

function BudgetForm({
  initial,
  onSubmit,
}: {
  initial?: Budget;
  onSubmit: (nombre: string) => void;
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
        onSubmit(nombre.trim());
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
        <button type="submit" className="btn-primary">
          <Icon name="check" size={16} />
          {initial ? "Guardar cambios" : "Crear presupuesto"}
        </button>
      </div>
    </form>
  );
}

export default function BudgetsPage() {
  const { activeBudgetId, setActiveBudgetId, currentUserId } =
    useActiveBudget();
  const { toast } = useToast();
  const loading = useMockLoading("presupuestos");

  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>();
  const [archiving, setArchiving] = useState<Budget | undefined>();
  const [leaving, setLeaving] = useState<Budget | undefined>();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-ink-soft">
            Resumen de {monthLabel(CURRENT_MONTH).toLowerCase()}
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listBudgets().map((b) => {
            const s = monthSummary(b.id, CURRENT_MONTH);
            const rol = b.miembros.find(
              (m) => m.userId === currentUserId,
            )?.rol;
            const activos = b.miembros.filter(
              (m) => m.estado !== "pendiente",
            ).length;
            const isActive = b.id === activeBudgetId;
            const isArchived = archived.has(b.id);
            const hasData = movementsByBudget(b.id).length > 0;

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
                  <Menu
                    label={`Opciones de ${b.nombre}`}
                    items={[
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
                        onClick: () => {
                          if (isArchived) {
                            setArchived((s2) => {
                              const n = new Set(s2);
                              n.delete(b.id);
                              return n;
                            });
                            toast(`«${b.nombre}» desarchivado`);
                          } else {
                            setArchiving(b);
                          }
                        },
                      },
                      {
                        label: "Salir del presupuesto",
                        icon: "logout",
                        danger: true,
                        onClick: () => setLeaving(b),
                      },
                    ]}
                  />
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
                        <p className="text-[11px] text-ink-faint">
                          Disponible
                        </p>
                        <Amount
                          value={s.disponible ?? s.balance}
                          className="text-[13px] font-semibold"
                        />
                      </div>
                    </div>
                    {s.progreso !== undefined && (
                      <ProgressBar pct={s.progreso} />
                    )}
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
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar «${editing.nombre}»` : "Crear presupuesto"}
      >
        <BudgetForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={(nombre) => {
            setFormOpen(false);
            toast(
              editing
                ? `Cambios guardados en «${nombre}»`
                : `Presupuesto «${nombre}» creado`,
            );
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={Boolean(archiving)}
        onClose={() => setArchiving(undefined)}
        onConfirm={() => {
          if (!archiving) return;
          setArchived((s2) => new Set(s2).add(archiving.id));
          toast(`«${archiving.nombre}» archivado`, "info");
        }}
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
        onConfirm={() =>
          toast(`Has salido de «${leaving?.nombre}» (simulado)`, "danger")
        }
        title="Salir del presupuesto"
        confirmLabel="Salir"
        description={
          <>
            Perderás el acceso a <strong>{leaving?.nombre}</strong> y a todos
            sus movimientos. Otro administrador tendría que invitarte de
            nuevo.
          </>
        }
      />
    </div>
  );
}
