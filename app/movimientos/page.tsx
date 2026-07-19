"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActiveBudget } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import { getCategory, movementsByBudget, CATEGORIES } from "@/lib/data";
import { getUser, USERS } from "@/lib/mock/users";
import { monthLabel } from "@/lib/mock/calendar";
import { formatWeekdayDay, formatMoney } from "@/lib/format";
import type { Movement } from "@/lib/types";
import {
  Amount,
  Badge,
  Card,
  SkeletonRows,
  cx,
} from "@/components/ui/primitives";
import { FilterChips, Field, Input, Select } from "@/components/ui/forms";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

type TypeFilter = "todos" | "ingresos" | "gastos" | "recurrentes";
type SortKey = "reciente" | "antiguo" | "mayor" | "menor";

const SORT_LABEL: Record<SortKey, string> = {
  reciente: "Más reciente primero",
  antiguo: "Más antiguo primero",
  mayor: "Mayor cantidad",
  menor: "Menor cantidad",
};

function MovementRow({ m }: { m: Movement }) {
  const cat = getCategory(m.categoriaId);
  const user = getUser(m.userId);
  return (
    <Link
      href={`/movimientos/${m.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-line-soft"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-line-soft text-base">
        {cat.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{m.concepto}</span>
          {m.recurrentId && (
            <span title="Movimiento recurrente" className="text-ink-faint">
              <Icon name="repeat" size={13} />
            </span>
          )}
          {m.nota && (
            <span title={m.nota} className="text-ink-faint">
              <Icon name="paperclip" size={12} />
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-ink-faint">
          {cat.nombre} · {user.nombre.split(" ")[0]}
        </span>
      </span>
      <Amount
        value={m.cantidad}
        tipo={m.tipo}
        signed
        className="shrink-0 text-sm font-semibold"
      />
    </Link>
  );
}

export default function MovementsPage() {
  const { activeBudgetId, activeBudget } = useActiveBudget();
  const loading = useMockLoading(activeBudgetId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [sort, setSort] = useState<SortKey>("reciente");
  const [showFilters, setShowFilters] = useState(false);
  const [categoria, setCategoria] = useState("todas");
  const [usuario, setUsuario] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const all = movementsByBudget(activeBudgetId);
  const memberIds = new Set(activeBudget.miembros.map((m) => m.userId));

  const activeFilterCount = [
    categoria !== "todas",
    usuario !== "todos",
    desde !== "",
    hasta !== "",
    min !== "",
    max !== "",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = all.filter((m) => {
      if (typeFilter === "ingresos" && m.tipo !== "ingreso") return false;
      if (typeFilter === "gastos" && m.tipo !== "gasto") return false;
      if (typeFilter === "recurrentes" && !m.recurrentId) return false;
      if (categoria !== "todas" && m.categoriaId !== categoria) return false;
      if (usuario !== "todos" && m.userId !== usuario) return false;
      if (desde && m.fecha < desde) return false;
      if (hasta && m.fecha > hasta) return false;
      if (min && m.cantidad < Number(min)) return false;
      if (max && m.cantidad > Number(max)) return false;
      if (q) {
        const cat = getCategory(m.categoriaId).nombre.toLowerCase();
        const hay =
          m.concepto.toLowerCase().includes(q) ||
          cat.includes(q) ||
          (m.nota ?? "").toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === "antiguo") list.reverse();
    if (sort === "mayor") list.sort((a, b) => b.cantidad - a.cantidad);
    if (sort === "menor") list.sort((a, b) => a.cantidad - b.cantidad);
    return list;
  }, [all, search, typeFilter, categoria, usuario, desde, hasta, min, max, sort]);

  // Agrupación por mes y fecha (solo con orden cronológico)
  const grouped = useMemo(() => {
    if (sort === "mayor" || sort === "menor") return null;
    const byMonth = new Map<string, Map<string, Movement[]>>();
    for (const m of filtered) {
      const monthKey = m.fecha.slice(0, 7);
      const month = byMonth.get(monthKey) ?? new Map<string, Movement[]>();
      const day = month.get(m.fecha) ?? [];
      day.push(m);
      month.set(m.fecha, day);
      byMonth.set(monthKey, month);
    }
    return byMonth;
  }, [filtered, sort]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("todos");
    setCategoria("todas");
    setUsuario("todos");
    setDesde("");
    setHasta("");
    setMin("");
    setMax("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
        <Link href="/movimientos/nuevo?tipo=gasto" className="btn-primary">
          <Icon name="plus" size={16} />
          Nuevo movimiento
        </Link>
      </div>

      {/* Búsqueda y filtros */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              type="search"
              placeholder="Buscar por concepto, categoría o nota"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Buscar movimientos"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className={cx(
              "btn-secondary relative",
              showFilters && "border-pine text-pine",
            )}
          >
            <Icon name="filter" size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pine text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterChips
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "todos", label: "Todos" },
              { value: "ingresos", label: "Ingresos" },
              { value: "gastos", label: "Gastos" },
              { value: "recurrentes", label: "Recurrentes" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <Icon name="sort" size={15} />
            <span className="sr-only">Ordenar por</span>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="!w-auto !py-1.5 text-[13px]"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {showFilters && (
          <Card className="fade-enter grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Categoría">
              <Select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Usuario">
              <Select
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              >
                <option value="todos">Todos los usuarios</option>
                {USERS.filter((u) => memberIds.has(u.id)).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde">
                <Input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </Field>
              <Field label="Hasta">
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cantidad mínima">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0 €"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </Field>
              <Field label="Cantidad máxima">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Sin límite"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary">
                <Icon name="x" size={15} />
                Limpiar filtros
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <Card>
          <SkeletonRows rows={7} />
        </Card>
      ) : all.length === 0 ? (
        <EmptyState
          emoji={activeBudget.emoji}
          title="Este presupuesto aún no tiene movimientos"
          description="Cuando alguien registre un gasto o un ingreso aparecerá aquí, agrupado por mes."
          action={
            <Link href="/movimientos/nuevo?tipo=gasto" className="btn-primary">
              <Icon name="plus" size={16} />
              Registrar movimiento
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description="Ningún movimiento coincide con la búsqueda o los filtros aplicados."
          action={
            <button onClick={clearFilters} className="btn-secondary">
              Limpiar búsqueda y filtros
            </button>
          }
        />
      ) : grouped ? (
        <div className="space-y-6">
          {[...grouped.entries()].map(([monthKey, days]) => {
            const monthMovs = [...days.values()].flat();
            const total = monthMovs.reduce(
              (s, m) => s + (m.tipo === "ingreso" ? m.cantidad : -m.cantidad),
              0,
            );
            return (
              <section key={monthKey}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
                    {monthLabel(monthKey)}
                  </h2>
                  <span
                    className={cx(
                      "amount text-sm font-semibold",
                      total >= 0 ? "text-income" : "text-expense",
                    )}
                  >
                    {total >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(total))}
                  </span>
                </div>
                <Card>
                  {[...days.entries()].map(([fecha, movs]) => (
                    <div key={fecha}>
                      <p className="border-b border-line-soft bg-paper/60 px-4 py-1.5 text-xs font-medium capitalize text-ink-faint">
                        {formatWeekdayDay(fecha)}
                      </p>
                      <ul className="divide-y divide-line-soft">
                        {movs.map((m) => (
                          <li key={m.id}>
                            <MovementRow m={m} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="border-b border-line-soft px-4 py-2 text-xs text-ink-faint">
            {filtered.length} movimientos ordenados por{" "}
            {SORT_LABEL[sort].toLowerCase()}
            <Badge variant="outline" className="ml-2">
              Sin agrupar
            </Badge>
          </div>
          <ul className="divide-y divide-line-soft">
            {filtered.map((m) => (
              <li key={m.id}>
                <MovementRow m={m} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
