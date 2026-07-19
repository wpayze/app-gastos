"use client";

import { useMemo, useState } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import {
  CATEGORIES,
  CATEGORY_LIMITS,
  categorySpending,
  movementsByBudget,
} from "@/lib/data";
import { CURRENT_MONTH, monthLabel } from "@/lib/mock/calendar";
import { formatMoney, formatPct } from "@/lib/format";
import type { Category, MovementType } from "@/lib/types";
import {
  Amount,
  Badge,
  Card,
  ProgressBar,
  Skeleton,
  cx,
} from "@/components/ui/primitives";
import { ConfirmDialog, Menu, Sheet } from "@/components/ui/overlays";
import { Field, Input, Select } from "@/components/ui/forms";
import { FilterChips } from "@/components/ui/forms";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

const EMOJI_CHOICES = ["🏠", "🛒", "🚌", "🩺", "🎬", "📺", "📚", "✈️", "💶", "🧑‍💻", "📈", "🧾", "🪙", "🎁", "🐶", "👶"];

function CategoryForm({
  initial,
  onSubmit,
}: {
  initial?: Category;
  onSubmit: (nombre: string) => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [tipo, setTipo] = useState<MovementType>(initial?.tipo ?? "gasto");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🏷️");
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
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Nombre">
          <Input
            placeholder="P. ej. Mascotas"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MovementType)}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </Select>
        </Field>
      </div>
      <Field label="Icono">
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-pressed={emoji === e}
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-lg border text-lg",
                emoji === e
                  ? "border-pine bg-pine-tint"
                  : "border-line hover:bg-line-soft",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          <Icon name="check" size={16} />
          {initial ? "Guardar cambios" : "Crear categoría"}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const { activeBudgetId, activeBudget } = useActiveBudget();
  const { toast } = useToast();
  const loading = useMockLoading(activeBudgetId);

  const [tab, setTab] = useState<"gasto" | "ingreso">("gasto");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [limitFor, setLimitFor] = useState<Category | undefined>();
  const [limitValue, setLimitValue] = useState("");
  const [deleting, setDeleting] = useState<Category | undefined>();

  const spending = useMemo(
    () => categorySpending(activeBudgetId, CURRENT_MONTH),
    [activeBudgetId],
  );
  const limits = CATEGORY_LIMITS[activeBudgetId] ?? {};
  const movs = movementsByBudget(activeBudgetId);

  const categorias = CATEGORIES.filter((c) => c.tipo === tab);

  const statsFor = (cat: Category) => {
    if (cat.tipo === "gasto") {
      const s = spending.find((x) => x.categoria.id === cat.id);
      return {
        total: s?.gastado ?? 0,
        count: s?.movimientos ?? 0,
        limite: s?.limite ?? limits[cat.id],
        pct: s?.pct,
      };
    }
    const list = movs.filter(
      (m) =>
        m.categoriaId === cat.id && m.fecha.startsWith(CURRENT_MONTH),
    );
    return {
      total: list.reduce((s, m) => s + m.cantidad, 0),
      count: list.length,
      limite: undefined,
      pct: undefined,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-ink-soft">
            Uso en {activeBudget.nombre} ·{" "}
            {monthLabel(CURRENT_MONTH).toLowerCase()}
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
          Crear categoría
        </button>
      </div>

      <FilterChips
        value={tab}
        onChange={setTab}
        options={[
          { value: "gasto", label: "Gastos" },
          { value: "ingreso", label: "Ingresos" },
        ]}
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3 p-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categorias.map((cat) => {
            const s = statsFor(cat);
            const sinUso = s.count === 0;
            return (
              <Card key={cat.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-line-soft text-xl">
                    {cat.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-semibold">
                        {cat.nombre}
                      </h2>
                      <Badge variant={cat.tipo === "gasto" ? "red" : "green"}>
                        {cat.tipo === "gasto" ? "Gasto" : "Ingreso"}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-faint">
                      {sinUso
                        ? "Sin movimientos este mes"
                        : `${s.count} ${s.count === 1 ? "movimiento" : "movimientos"} este mes`}
                    </p>
                  </div>
                  <Menu
                    label={`Opciones de ${cat.nombre}`}
                    items={[
                      {
                        label: "Editar",
                        icon: "pencil",
                        onClick: () => {
                          setEditing(cat);
                          setFormOpen(true);
                        },
                      },
                      ...(cat.tipo === "gasto"
                        ? [
                            {
                              label: s.limite
                                ? "Cambiar límite mensual"
                                : "Definir límite mensual",
                              icon: "bell" as const,
                              onClick: () => {
                                setLimitFor(cat);
                                setLimitValue(
                                  s.limite ? String(s.limite) : "",
                                );
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Eliminar",
                        icon: "trash",
                        danger: true,
                        onClick: () => setDeleting(cat),
                      },
                    ]}
                  />
                </div>

                <div className="mt-3">
                  {sinUso ? (
                    <p className="rounded-lg bg-paper px-3 py-2 text-center text-xs text-ink-faint">
                      {cat.tipo === "gasto"
                        ? "Esta categoría no tiene gastos todavía."
                        : "Sin ingresos registrados este mes."}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between">
                        <Amount
                          value={s.total}
                          className="text-lg font-semibold"
                        />
                        {s.limite !== undefined && (
                          <span
                            className={cx(
                              "text-xs font-medium",
                              (s.pct ?? 0) >= 100
                                ? "text-expense"
                                : (s.pct ?? 0) >= 85
                                  ? "text-amber"
                                  : "text-ink-faint",
                            )}
                          >
                            {formatPct(s.pct ?? 0)} de{" "}
                            {formatMoney(s.limite, { compact: true })}
                          </span>
                        )}
                      </div>
                      {s.limite !== undefined && (
                        <ProgressBar pct={s.pct ?? 0} className="mt-1.5" />
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && categorias.length === 0 && (
        <EmptyState
          icon="tag"
          title="Sin categorías"
          description="Crea categorías para clasificar los movimientos."
        />
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar «${editing.nombre}»` : "Crear categoría"}
      >
        <CategoryForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={(nombre) => {
            setFormOpen(false);
            toast(
              editing
                ? `Cambios guardados en «${nombre}»`
                : `Categoría «${nombre}» creada`,
            );
          }}
        />
      </Sheet>

      <Sheet
        open={Boolean(limitFor)}
        onClose={() => setLimitFor(undefined)}
        title={`Límite mensual de ${limitFor?.nombre ?? ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast(
              limitValue
                ? `Límite de ${limitFor?.nombre} fijado en ${formatMoney(Number(limitValue))}`
                : `Límite de ${limitFor?.nombre} eliminado`,
            );
            setLimitFor(undefined);
          }}
          className="space-y-4"
        >
          <Field
            label="Límite mensual"
            hint="Recibirás una alerta al superar el 85 % y al pasarte del límite. Deja el campo vacío para quitarlo."
          >
            <Input
              inputMode="decimal"
              placeholder="0,00 €"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
            />
          </Field>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              <Icon name="check" size={16} />
              Guardar límite
            </button>
          </div>
        </form>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={() =>
          toast(`Categoría «${deleting?.nombre}» eliminada`, "danger")
        }
        title="Eliminar categoría"
        description={
          <>
            Los movimientos de <strong>{deleting?.nombre}</strong> pasarán a
            «Sin categoría». Esta acción afecta a todos los presupuestos.
          </>
        }
      />
    </div>
  );
}
