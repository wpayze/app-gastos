"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCurrentUser, useToast } from "@/lib/store";
import { formatDate, formatForeignMoney, formatMoney } from "@/lib/format";
import type { Category, PendingMovement, PendingStatus } from "@/lib/types";
import {
  addPendingAction,
  restorePendingAction,
  skipPendingAction,
} from "@/app/pendientes/actions";
import { Badge, Card, cx, type BadgeVariant } from "@/components/ui/primitives";
import { FilterChips, Field, Input, Select } from "@/components/ui/forms";
import { Sheet } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";
import { QuickCreateCategory } from "@/components/categories/quick-create-category";

type Filter = PendingStatus | "todos";

const STATUS_LABEL: Record<PendingStatus, string> = {
  pendiente: "Pendiente",
  agregado: "Agregado",
  omitido: "Omitido",
};

const STATUS_BADGE: Record<PendingStatus, BadgeVariant> = {
  pendiente: "amber",
  agregado: "green",
  omitido: "gray",
};

function formatPendingAmount(p: PendingMovement) {
  return p.moneda === "EUR"
    ? formatMoney(p.cantidad)
    : formatForeignMoney(p.cantidad, p.moneda);
}

function AddForm({
  pending,
  categories,
  onCategoryCreated,
  busy,
  onSubmit,
}: {
  pending: PendingMovement;
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  busy: boolean;
  onSubmit: (values: { concepto: string; categoriaId: string; fecha: string }) => void;
}) {
  const [concepto, setConcepto] = useState(pending.comercio);
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState(pending.fecha);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!concepto.trim()) return setError("Escribe un concepto.");
        if (!categoria) return setError("Elige una categoría.");
        if (!fecha) return setError("Elige una fecha.");
        setError("");
        onSubmit({ concepto: concepto.trim(), categoriaId: categoria, fecha });
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-expense-tint px-3 py-2 text-sm font-medium text-expense">
          {error}
        </p>
      )}
      <p className="text-sm text-ink-soft">
        Compra de <strong>{formatPendingAmount(pending)}</strong>
        {pending.moneda !== "EUR" && " (se convertirá a euros)"}.
      </p>
      <Field label="Concepto">
        <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Elegir…</option>
            {categories
              .filter((c) => c.tipo === "gasto")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nombre}
                </option>
              ))}
          </Select>
          <QuickCreateCategory
            tipo="gasto"
            onCreated={(cat) => {
              onCategoryCreated(cat);
              setCategoria(cat.id);
            }}
          />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          <Icon name="check" size={16} />
          {busy ? "Agregando…" : "Agregar movimiento"}
        </button>
      </div>
    </form>
  );
}

export function PendingView({
  initialPending,
  categories: initialCategories,
}: {
  initialPending: PendingMovement[];
  categories: Category[];
}) {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [items, setItems] = useState(initialPending);
  const [categories, setCategories] = useState(initialCategories);
  const [filter, setFilter] = useState<Filter>("pendiente");
  const [adding, setAdding] = useState<PendingMovement | null>(null);
  const [busy, startTransition] = useTransition();

  const count = (s: PendingStatus) => items.filter((p) => p.estado === s).length;
  const visible = items.filter((p) => filter === "todos" || p.estado === filter);

  const replace = (updated: PendingMovement) =>
    setItems((list) => list.map((p) => (p.id === updated.id ? updated : p)));

  const run = (fn: () => Promise<PendingMovement>, ok: string, after?: () => void) =>
    startTransition(async () => {
      try {
        replace(await fn());
        toast(ok);
        after?.();
      } catch {
        toast("No se pudo completar. Intenta de nuevo.", "danger");
      }
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pendientes</h1>
        <p className="text-sm text-ink-soft">
          Compras detectadas en los correos del banco. Agrégalas como movimiento u
          omítelas; siempre quedan guardadas aquí.
        </p>
      </div>

      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pendiente", label: `Pendientes (${count("pendiente")})` },
          { value: "omitido", label: `Omitidos (${count("omitido")})` },
          { value: "agregado", label: `Agregados (${count("agregado")})` },
          { value: "todos", label: "Todos" },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="mail"
          title={filter === "pendiente" ? "Nada pendiente" : "Sin resultados"}
          description="Cuando llegue un correo del banco con una compra, aparecerá aquí."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line-soft">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.comercio}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    {formatDate(p.fecha)}
                    <Badge variant={STATUS_BADGE[p.estado]}>
                      {STATUS_LABEL[p.estado]}
                    </Badge>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="amount text-sm font-semibold text-expense">
                    {formatPendingAmount(p)}
                  </span>
                  {p.estado === "agregado" && (
                    <Link
                      href={
                        p.movementId ? `/movimientos/${p.movementId}` : "/movimientos"
                      }
                      className="text-sm font-medium text-pine hover:underline"
                    >
                      Ver
                    </Link>
                  )}
                  {p.estado === "omitido" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => restorePendingAction(p.id, user.id),
                          "Devuelto a pendientes",
                        )
                      }
                      className="btn-secondary disabled:opacity-60"
                    >
                      Restaurar
                    </button>
                  )}
                  {p.estado !== "agregado" && (
                    <>
                      {p.estado === "pendiente" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() => skipPendingAction(p.id, user.id), "Omitido")
                          }
                          className={cx("btn-secondary disabled:opacity-60")}
                        >
                          Omitir
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => setAdding(p)}
                        className="btn-primary disabled:opacity-60"
                      >
                        Agregar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Sheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        title="Agregar movimiento"
      >
        {adding && (
          <AddForm
            key={adding.id}
            pending={adding}
            categories={categories}
            onCategoryCreated={(c) => setCategories((list) => [...list, c])}
            busy={busy}
            onSubmit={(values) =>
              run(
                () => addPendingAction(adding.id, { ...values, userId: user.id }),
                `«${values.concepto}» agregado a movimientos`,
                () => setAdding(null),
              )
            }
          />
        )}
      </Sheet>
    </div>
  );
}
