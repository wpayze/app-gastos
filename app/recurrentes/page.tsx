"use client";

import { useMemo, useState } from "react";
import { useActiveBudget, useToast } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import { getCategory, recurrentsByBudget, CATEGORIES } from "@/lib/data";
import { formatDate, relativeDay } from "@/lib/format";
import { FREQUENCY_LABEL, RECURRENT_STATUS_LABEL } from "@/lib/labels";
import type { Frequency, Recurrent } from "@/lib/types";
import {
  Amount,
  Badge,
  Card,
  SkeletonRows,
  cx,
  type BadgeVariant,
} from "@/components/ui/primitives";
import { FilterChips, Field, Input, Select } from "@/components/ui/forms";
import { ConfirmDialog, Menu, Sheet } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

type Filter = "todos" | "ingresos" | "gastos" | "activos" | "pausados";

const STATUS_BADGE: Record<Recurrent["estado"], BadgeVariant> = {
  activo: "green",
  pausado: "amber",
  finalizado: "gray",
};

function RecurrentForm({
  initial,
  onSubmit,
}: {
  initial?: Recurrent;
  onSubmit: (nombre: string) => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cantidad, setCantidad] = useState(
    initial ? String(initial.cantidad) : "",
  );
  const [tipo, setTipo] = useState(initial?.tipo ?? "gasto");
  const [categoria, setCategoria] = useState(initial?.categoriaId ?? "");
  const [frecuencia, setFrecuencia] = useState<Frequency>(
    initial?.frecuencia ?? "mensual",
  );
  const [inicio, setInicio] = useState(initial?.fechaInicio ?? "2026-08-01");
  const [fin, setFin] = useState(initial?.fechaFin ?? "");
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim() || !cantidad || Number(cantidad) <= 0) {
          setError("Completa el nombre y una cantidad mayor que cero.");
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Recurrent["tipo"])}
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
            {CATEGORIES.filter((c) => c.tipo === tipo).map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.nombre}
              </option>
            ))}
          </Select>
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
        <button type="submit" className="btn-primary">
          <Icon name="check" size={16} />
          {initial ? "Guardar cambios" : "Crear recurrente"}
        </button>
      </div>
    </form>
  );
}

export default function RecurrentsPage() {
  const { activeBudgetId } = useActiveBudget();
  // La key reinicia la lista y los filtros al cambiar de presupuesto
  return <Recurrents key={activeBudgetId} />;
}

function Recurrents() {
  const { activeBudgetId, activeBudget } = useActiveBudget();
  const { toast } = useToast();
  const loading = useMockLoading(activeBudgetId);
  const [filter, setFilter] = useState<Filter>("todos");

  // Copia local para que pausar/reanudar/eliminar se vean en la sesión
  const [items, setItems] = useState<Recurrent[]>(() =>
    recurrentsByBudget(activeBudgetId),
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recurrent | undefined>();
  const [deleting, setDeleting] = useState<Recurrent | undefined>();

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

  const setEstado = (id: string, estado: Recurrent["estado"]) => {
    setItems((list) =>
      list.map((r) => (r.id === id ? { ...r, estado } : r)),
    );
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
          Cada elemento se añadirá automáticamente como movimiento en su
          periodo correspondiente cuando la funcionalidad esté conectada. Hoy
          los datos son una simulación.
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

      {loading ? (
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      ) : items.length === 0 ? (
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
              const cat = getCategory(r.categoriaId);
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
                        ? `Próximo: ${relativeDay(r.proximaFecha)} (${formatDate(r.proximaFecha)})`
                        : r.estado === "pausado"
                          ? "En pausa: no genera movimientos"
                          : "Finalizado"}
                    </p>
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
                            onClick: () => {
                              setEstado(r.id, "pausado");
                              toast(`«${r.nombre}» pausado`, "info");
                            },
                          }
                        : {
                            label: "Reanudar",
                            icon: "play",
                            onClick: () => {
                              setEstado(r.id, "activo");
                              toast(`«${r.nombre}» reanudado`);
                            },
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
          initial={editing}
          onSubmit={(nombre) => {
            setFormOpen(false);
            toast(
              editing
                ? `Cambios guardados en «${nombre}»`
                : `Recurrente «${nombre}» creado`,
            );
          }}
        />
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          setItems((list) => list.filter((r) => r.id !== deleting.id));
          toast(`Recurrente «${deleting.nombre}» eliminado`, "danger");
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
