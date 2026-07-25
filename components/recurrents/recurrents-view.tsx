"use client";

import { useMemo, useState, useTransition } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { formatDate, relativeDay } from "@/lib/format";
import { addInterval, isoToMonthKey } from "@/lib/calendar";
import { isRecurrentPendingForMonth } from "@/lib/recurrents";
import { FREQUENCY_LABEL, RECURRENT_STATUS_LABEL } from "@/lib/labels";
import type {
  Category,
  Frequency,
  Movement,
  MovementType,
  Recurrent,
} from "@/lib/types";
import {
  addRecurrentMovementAction,
  createRecurrentAction,
  deleteRecurrentAction,
  pauseRecurrentAction,
  resumeRecurrentAction,
  updateRecurrentAction,
} from "@/app/recurrentes/actions";
import {
  Amount,
  Badge,
  Card,
  cx,
  type BadgeVariant,
} from "@/components/ui/primitives";
import { FilterChips, Field, Input, Select } from "@/components/ui/forms";
import { ConfirmDialog, Menu, Sheet } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";
import { QuickCreateCategory } from "@/components/categories/quick-create-category";

type Filter = "todos" | "ingresos" | "gastos" | "activos" | "pausados";

const STATUS_BADGE: Record<Recurrent["estado"], BadgeVariant> = {
  activo: "green",
  pausado: "amber",
  finalizado: "gray",
};

const FALLBACK_CATEGORY: Category = {
  id: "",
  nombre: "Sin categoría",
  tipo: "gasto",
  emoji: "🏷️",
};

function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? { ...FALLBACK_CATEGORY, id };
}

export interface RecurrentFormValues {
  tipo: MovementType;
  nombre: string;
  cantidad: number;
  categoriaId: string;
  frecuencia: Frequency;
  fechaInicio: string;
  fechaFin?: string;
}

function RecurrentForm({
  categories,
  onCategoryCreated,
  initial,
  pending,
  onSubmit,
}: {
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  initial?: Recurrent;
  pending: boolean;
  onSubmit: (values: RecurrentFormValues) => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cantidad, setCantidad] = useState(
    initial ? String(initial.cantidad) : "",
  );
  const [tipo, setTipo] = useState<MovementType>(initial?.tipo ?? "gasto");
  const [categoria, setCategoria] = useState(initial?.categoriaId ?? "");
  const [frecuencia, setFrecuencia] = useState<Frequency>(
    initial?.frecuencia ?? "mensual",
  );
  const [inicio, setInicio] = useState(initial?.fechaInicio ?? "");
  const [fin, setFin] = useState(initial?.fechaFin ?? "");
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const cantidadNum = Number(cantidad.replace(",", "."));
        if (!nombre.trim() || !cantidad || cantidadNum <= 0) {
          setError("Completa el nombre y una cantidad mayor que cero.");
          return;
        }
        if (!categoria) {
          setError("Elige una categoría.");
          return;
        }
        if (!inicio) {
          setError("Elige una fecha de inicio.");
          return;
        }
        setError("");
        onSubmit({
          tipo,
          nombre: nombre.trim(),
          cantidad: cantidadNum,
          categoriaId: categoria,
          frecuencia,
          fechaInicio: inicio,
          fechaFin: fin || undefined,
        });
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-expense-tint px-3 py-2 text-sm font-medium text-expense">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MovementType)}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </Select>
        </Field>
        <Field label="Cantidad">
          <Input
            inputMode="decimal"
            placeholder="0,00 €"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Nombre">
        <Input
          placeholder="P. ej. Renta, Gimnasio, Sueldo…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Elegir…</option>
            {categories
              .filter((c) => c.tipo === tipo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nombre}
                </option>
              ))}
          </Select>
          <QuickCreateCategory
            tipo={tipo}
            onCreated={(cat) => {
              onCategoryCreated(cat);
              setCategoria(cat.id);
            }}
          />
        </Field>
        <Field label="Frecuencia">
          <Select
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value as Frequency)}
          >
            {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha de inicio">
          <Input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </Field>
        <Field label="Finaliza (opcional)">
          <Input
            type="date"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <Icon name="check" size={16} />
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear recurrente"}
        </button>
      </div>
    </form>
  );
}

export function RecurrentsView({
  budgetId,
  initialRecurrents,
  categories,
  movementsThisMonth,
  month,
  today,
}: {
  budgetId: string;
  initialRecurrents: Recurrent[];
  categories: Category[];
  movementsThisMonth: Movement[];
  month: string;
  today: string;
}) {
  const { activeBudget } = useActiveBudget();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("todos");
  const [items, setItems] = useState<Recurrent[]>(initialRecurrents);
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [monthMovements, setMonthMovements] = useState<Movement[]>(movementsThisMonth);
  const [pending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recurrent | undefined>();
  const [deleting, setDeleting] = useState<Recurrent | undefined>();
  const [addToMonthFor, setAddToMonthFor] = useState<Recurrent | undefined>();
  const [addDate, setAddDate] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((r) => {
        if (filter === "ingresos") return r.tipo === "ingreso";
        if (filter === "gastos") return r.tipo === "gasto";
        if (filter === "activos") return r.estado === "activo";
        if (filter === "pausados") return r.estado === "pausado";
        return true;
      }),
    [items, filter],
  );

  const handleSubmit = (values: RecurrentFormValues) => {
    startTransition(async () => {
      try {
        if (editing) {
          const updated = await updateRecurrentAction(editing.id, values);
          setItems((list) =>
            list.map((r) => (r.id === updated.id ? updated : r)),
          );
          toast(`Cambios guardados en «${updated.nombre}»`);
        } else {
          const created = await createRecurrentAction(budgetId, values);
          setItems((list) => [...list, created]);
          toast(`Recurrente «${created.nombre}» creado`);
        }
        setFormOpen(false);
      } catch {
        toast("No se pudo guardar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handlePause = (r: Recurrent) => {
    setItems((list) =>
      list.map((x) => (x.id === r.id ? { ...x, estado: "pausado" } : x)),
    );
    toast(`«${r.nombre}» pausado`, "info");
    startTransition(async () => {
      try {
        await pauseRecurrentAction(r.id, budgetId, r.nombre);
      } catch {
        toast("No se pudo pausar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleResume = (r: Recurrent) => {
    setItems((list) =>
      list.map((x) => (x.id === r.id ? { ...x, estado: "activo" } : x)),
    );
    toast(`«${r.nombre}» reanudado`);
    startTransition(async () => {
      try {
        await resumeRecurrentAction(r.id, budgetId, r.nombre);
      } catch {
        toast("No se pudo reanudar. Intenta de nuevo.", "danger");
      }
    });
  };

  const handleDelete = (r: Recurrent) => {
    setItems((list) => list.filter((x) => x.id !== r.id));
    toast(`Recurrente «${r.nombre}» eliminado`, "danger");
    startTransition(async () => {
      try {
        await deleteRecurrentAction(r.id);
      } catch {
        toast("No se pudo eliminar. Intenta de nuevo.", "danger");
      }
    });
  };

  const openAddToMonth = (r: Recurrent) => {
    // Si proximaFecha ya cae en este mes se usa como sugerencia; si no
    // (viene de otro mes u otra época), se propone hoy.
    setAddDate(isoToMonthKey(r.proximaFecha) === month ? r.proximaFecha : today);
    setAddToMonthFor(r);
  };

  const handleAddToMonth = () => {
    if (!addToMonthFor || !addDate) return;
    const r = addToMonthFor;
    const fecha = addDate;
    setAddToMonthFor(undefined);
    startTransition(async () => {
      try {
        const movement = await addRecurrentMovementAction(r.id, fecha);
        setMonthMovements((list) => [...list, movement]);
        const nextProximaFecha = addInterval(fecha, r.frecuencia);
        setItems((list) =>
          list.map((x) =>
            x.id === r.id
              ? {
                  ...x,
                  proximaFecha: nextProximaFecha,
                  estado:
                    x.fechaFin && nextProximaFecha > x.fechaFin
                      ? "finalizado"
                      : x.estado,
                }
              : x,
          ),
        );
        toast(`Movimiento de «${r.nombre}» añadido a este mes`);
      } catch {
        toast("No se pudo añadir. Intenta de nuevo.", "danger");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Recurrentes</h1>
        <button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Icon name="plus" size={16} />
          Crear recurrente
        </button>
      </div>

      <Card className="flex items-start gap-3 border-pine/25 bg-pine-tint px-4 py-3">
        <Icon name="repeat" size={17} className="mt-0.5 shrink-0 text-pine" />
        <p className="text-sm text-pine-deep">
          Los recurrentes no se añaden solos: cuando llegue el cobro o el
          ingreso, usa <strong>Agregar a este mes</strong> para crear el
          movimiento en la fecha exacta en que ocurrió.
        </p>
      </Card>

      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "todos", label: "Todos" },
          { value: "ingresos", label: "Ingresos" },
          { value: "gastos", label: "Gastos" },
          { value: "activos", label: "Activos" },
          { value: "pausados", label: "Pausados" },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="Sin movimientos recurrentes"
          description="Crea recurrentes para pagos e ingresos que se repiten: renta, suscripciones, sueldo…"
          action={
            <button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              className="btn-primary"
            >
              <Icon name="plus" size={16} />
              Crear el primero
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="filter"
          title="Nada con este filtro"
          description="No hay recurrentes que coincidan con el filtro seleccionado."
          action={
            <button onClick={() => setFilter("todos")} className="btn-secondary">
              Ver todos
            </button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line-soft">
            {filtered.map((r) => {
              const cat = findCategory(categoryList, r.categoriaId);
              const pendingThisMonth = isRecurrentPendingForMonth(
                r,
                month,
                monthMovements,
              );
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-line-soft text-lg">
                    {cat.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-semibold">
                        {r.nombre}
                      </span>
                      <Badge variant={STATUS_BADGE[r.estado]}>
                        {RECURRENT_STATUS_LABEL[r.estado]}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-ink-faint">
                      {FREQUENCY_LABEL[r.frecuencia]} · {cat.nombre} · desde{" "}
                      {formatDate(r.fechaInicio)}
                      {r.fechaFin ? ` hasta ${formatDate(r.fechaFin)}` : ""}
                    </p>
                    <p
                      className={cx(
                        "text-xs",
                        r.estado === "activo"
                          ? "font-medium text-pine"
                          : "text-ink-faint",
                      )}
                    >
                      {r.estado === "activo"
                        ? `Próximo: ${relativeDay(r.proximaFecha, today)} (${formatDate(r.proximaFecha)})`
                        : r.estado === "pausado"
                          ? "En pausa: no genera movimientos"
                          : "Finalizado"}
                    </p>
                    {r.estado === "activo" && (
                      <div className="mt-1.5">
                        {pendingThisMonth ? (
                          <button
                            onClick={() => openAddToMonth(r)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-tint px-2.5 py-1 text-xs font-semibold text-amber hover:brightness-95"
                          >
                            <Icon name="plus" size={12} />
                            Agregar a este mes
                          </button>
                        ) : (
                          <Badge variant="green">
                            <Icon name="check" size={11} />
                            Añadido este mes
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Amount
                    value={r.cantidad}
                    tipo={r.tipo}
                    signed
                    className="shrink-0 text-sm font-semibold"
                  />
                  <Menu
                    label={`Opciones de ${r.nombre}`}
                    items={[
                      {
                        label: "Editar",
                        icon: "pencil",
                        onClick: () => {
                          setEditing(r);
                          setFormOpen(true);
                        },
                      },
                      r.estado === "activo"
                        ? {
                            label: "Pausar",
                            icon: "pause",
                            onClick: () => handlePause(r),
                          }
                        : {
                            label: "Reanudar",
                            icon: "play",
                            onClick: () => handleResume(r),
                          },
                      {
                        label: "Eliminar",
                        icon: "trash",
                        danger: true,
                        onClick: () => setDeleting(r),
                      },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar «${editing.nombre}»` : "Crear recurrente"}
      >
        <RecurrentForm
          key={editing?.id ?? "new"}
          categories={categoryList}
          onCategoryCreated={(cat) => setCategoryList((l) => [...l, cat])}
          initial={editing}
          pending={pending}
          onSubmit={handleSubmit}
        />
      </Sheet>

      <Sheet
        open={Boolean(addToMonthFor)}
        onClose={() => setAddToMonthFor(undefined)}
        title={`Agregar «${addToMonthFor?.nombre ?? ""}» a este mes`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddToMonth();
          }}
          className="space-y-4"
        >
          <Field
            label="Fecha del cobro/ingreso"
            hint="La fecha real en que ocurrió, aunque no coincida con la fecha prevista."
          >
            <Input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <Icon name="check" size={16} />
              {pending ? "Añadiendo…" : "Añadir movimiento"}
            </button>
          </div>
        </form>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          handleDelete(deleting);
        }}
        title="Eliminar recurrente"
        description={
          <>
            Se eliminará <strong>{deleting?.nombre}</strong> de{" "}
            {activeBudget.nombre}. Los movimientos ya generados no se
            borrarán.
          </>
        }
      />
    </div>
  );
}
