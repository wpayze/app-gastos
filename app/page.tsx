"use client";

import { useState } from "react";
import Link from "next/link";
import { useActiveBudget } from "@/lib/store";
import { useMockLoading } from "@/lib/hooks";
import {
  availableMonths,
  categoryAlerts,
  categorySpending,
  getCategory,
  monthSummary,
  movementsByBudget,
  prevMonthSummary,
  recentActivity,
  topExpenses,
  upcomingRecurrents,
} from "@/lib/data";
import { getUser } from "@/lib/mock/users";
import { CURRENT_MONTH } from "@/lib/mock/calendar";
import {
  formatDateShort,
  formatMoney,
  formatPct,
  pctChange,
  relativeDay,
} from "@/lib/format";
import { FREQUENCY_LABEL } from "@/lib/labels";
import {
  Amount,
  Avatar,
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  Skeleton,
  SkeletonRows,
  cx,
} from "@/components/ui/primitives";
import { MonthPicker } from "@/components/ui/month-picker";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icon";

function TrendBadge({
  current,
  previous,
  goodWhenDown = false,
}: {
  current: number;
  previous: number | undefined;
  goodWhenDown?: boolean;
}) {
  if (previous === undefined) {
    return <span className="text-xs text-ink-faint">Sin mes anterior</span>;
  }
  const change = pctChange(current, previous);
  if (change === null) return <span className="text-xs text-ink-faint">—</span>;
  const up = change >= 0;
  const good = goodWhenDown ? !up : up;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 text-xs font-semibold",
        good ? "text-income" : "text-expense",
      )}
    >
      <Icon name={up ? "arrowUpRight" : "arrowDownRight"} size={13} />
      {formatPct(Math.abs(change))} vs. mes anterior
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <SkeletonRows rows={4} />
        </Card>
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { activeBudget, activeBudgetId } = useActiveBudget();
  // La key reinicia el mes seleccionado al cambiar de presupuesto
  return (
    <Dashboard
      key={activeBudgetId}
      activeBudget={activeBudget}
      activeBudgetId={activeBudgetId}
    />
  );
}

function Dashboard({
  activeBudget,
  activeBudgetId,
}: {
  activeBudget: ReturnType<typeof useActiveBudget>["activeBudget"];
  activeBudgetId: string;
}) {
  const months = availableMonths(activeBudgetId);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const loading = useMockLoading(`${activeBudgetId}-${month}`);

  const hasAnyData = movementsByBudget(activeBudgetId).length > 0;
  const summary = monthSummary(activeBudgetId, month);
  const prev = prevMonthSummary(activeBudgetId, month);
  const gastosTop = topExpenses(activeBudgetId, month);
  const porCategoria = categorySpending(activeBudgetId, month)
    .filter((c) => c.gastado > 0)
    .slice(0, 5);
  const alertas = categoryAlerts(activeBudgetId, month);
  const proximos = upcomingRecurrents(activeBudgetId);
  const actividad = recentActivity(activeBudgetId, 6);
  const maxCategoria = porCategoria[0]?.gastado ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeBudget.emoji} {activeBudget.nombre}
          </h1>
          <p className="text-sm text-ink-soft">{activeBudget.descripcion}</p>
        </div>
        <MonthPicker months={months} value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : !hasAnyData ? (
        <EmptyState
          emoji={activeBudget.emoji}
          title="Este presupuesto aún no tiene movimientos"
          description="Registra el primer gasto o ingreso para empezar a ver el balance, las categorías y la actividad del equipo."
          action={
            <Link href="/movimientos/nuevo?tipo=gasto" className="btn-primary">
              <Icon name="plus" size={16} />
              Registrar el primer movimiento
            </Link>
          }
        />
      ) : summary.movimientos === 0 ? (
        <EmptyState
          icon="calendar"
          title="Sin movimientos este mes"
          description="No hay datos registrados en este periodo. Prueba con otro mes o crea un movimiento."
          action={
            <Link href="/movimientos/nuevo?tipo=gasto" className="btn-primary">
              <Icon name="plus" size={16} />
              Nuevo movimiento
            </Link>
          }
        />
      ) : (
        <>
          {summary.parcial && (
            <Card className="flex items-center gap-3 border-amber/40 bg-amber-tint px-4 py-3 text-sm text-amber">
              <Icon name="info" size={17} />
              Este mes tiene datos parciales: el presupuesto se creó más tarde.
            </Card>
          )}

          {/* Balance del mes */}
          <Card className="p-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Balance del mes
            </p>
            <p className="mt-2">
              <span
                className={cx(
                  "amount total-rule text-4xl font-semibold sm:text-5xl",
                  summary.balance >= 0 ? "text-pine-deep" : "text-expense",
                )}
              >
                {summary.balance >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(summary.balance))}
              </span>
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[13px] text-ink-soft">Ingresos</p>
                <Amount
                  value={summary.ingresos}
                  className="text-xl font-semibold text-income"
                />
                <div className="mt-0.5">
                  <TrendBadge
                    current={summary.ingresos}
                    previous={prev?.ingresos}
                  />
                </div>
              </div>
              <div>
                <p className="text-[13px] text-ink-soft">Gastos</p>
                <Amount
                  value={summary.gastos}
                  className="text-xl font-semibold text-expense"
                />
                <div className="mt-0.5">
                  <TrendBadge
                    current={summary.gastos}
                    previous={prev?.gastos}
                    goodWhenDown
                  />
                </div>
              </div>
              {summary.disponible !== undefined && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-[13px] text-ink-soft">
                    Disponible de{" "}
                    {formatMoney(activeBudget.limiteMensual ?? 0, {
                      compact: true,
                    })}
                  </p>
                  <Amount
                    value={summary.disponible}
                    className={cx(
                      "text-xl font-semibold",
                      summary.disponible < 0 ? "text-expense" : "text-ink",
                    )}
                  />
                  <ProgressBar pct={summary.progreso ?? 0} className="mt-2" />
                  <p className="mt-1 text-xs text-ink-faint">
                    {formatPct(summary.progreso ?? 0)} del presupuesto mensual
                    utilizado
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Alertas de límites */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              {alertas.map((a) => {
                const over = (a.pct ?? 0) >= 100;
                return (
                  <Card
                    key={a.categoria.id}
                    className={cx(
                      "flex items-center gap-3 px-4 py-3",
                      over
                        ? "border-expense/40 bg-expense-tint"
                        : "border-amber/40 bg-amber-tint",
                    )}
                  >
                    <Icon
                      name="alert"
                      size={18}
                      className={over ? "text-expense" : "text-amber"}
                    />
                    <p className="flex-1 text-sm">
                      <strong>{a.categoria.nombre}</strong>{" "}
                      {over
                        ? "ha superado su límite"
                        : "está cerca de su límite"}
                      : <Amount value={a.gastado} className="font-semibold" />{" "}
                      de {formatMoney(a.limite ?? 0)} ({formatPct(a.pct ?? 0)})
                    </p>
                    <Link
                      href="/categorias"
                      className="text-sm font-semibold text-pine hover:underline"
                    >
                      Revisar
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Gastos más altos */}
            <section>
              <SectionTitle
                action={
                  <Link
                    href="/movimientos"
                    className="text-sm font-medium text-pine hover:underline"
                  >
                    Ver todos
                  </Link>
                }
              >
                Gastos más altos del mes
              </SectionTitle>
              <Card>
                {gastosTop.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-faint">
                    Sin gastos este mes.
                  </p>
                ) : (
                  <ul className="divide-y divide-line-soft">
                    {gastosTop.map((m) => {
                      const cat = getCategory(m.categoriaId);
                      return (
                        <li key={m.id}>
                          <Link
                            href={`/movimientos/${m.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-line-soft"
                          >
                            <span className="text-lg">{cat.emoji}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {m.concepto}
                              </span>
                              <span className="block text-xs text-ink-faint">
                                {cat.nombre} · {formatDateShort(m.fecha)}
                              </span>
                            </span>
                            <Amount
                              value={m.cantidad}
                              tipo="gasto"
                              signed
                              className="text-sm font-semibold"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            {/* Categorías con mayor gasto */}
            <section>
              <SectionTitle
                action={
                  <Link
                    href="/categorias"
                    className="text-sm font-medium text-pine hover:underline"
                  >
                    Gestionar
                  </Link>
                }
              >
                Categorías con mayor gasto
              </SectionTitle>
              <Card className="p-4">
                {porCategoria.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-faint">
                    Sin gastos por categoría.
                  </p>
                ) : (
                  <ul className="space-y-3.5">
                    {porCategoria.map((c) => (
                      <li key={c.categoria.id}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span>{c.categoria.emoji}</span>
                            <span className="truncate font-medium">
                              {c.categoria.nombre}
                            </span>
                            <span className="text-xs text-ink-faint">
                              {c.movimientos} mov.
                            </span>
                          </span>
                          <Amount
                            value={c.gastado}
                            className="text-sm font-semibold"
                          />
                        </div>
                        <ProgressBar
                          pct={
                            c.pct !== undefined
                              ? c.pct
                              : (c.gastado / maxCategoria) * 100
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* Próximos recurrentes */}
            <section>
              <SectionTitle
                action={
                  <Link
                    href="/recurrentes"
                    className="text-sm font-medium text-pine hover:underline"
                  >
                    Ver todos
                  </Link>
                }
              >
                Próximos movimientos recurrentes
              </SectionTitle>
              <Card>
                {proximos.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-faint">
                    No hay recurrentes programados.
                  </p>
                ) : (
                  <ul className="divide-y divide-line-soft">
                    {proximos.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="rounded-full bg-line-soft p-2 text-ink-soft">
                          <Icon name="repeat" size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {r.nombre}
                          </span>
                          <span className="block text-xs text-ink-faint">
                            {FREQUENCY_LABEL[r.frecuencia]} ·{" "}
                            {relativeDay(r.proximaFecha)}
                          </span>
                        </span>
                        <Amount
                          value={r.cantidad}
                          tipo={r.tipo}
                          signed
                          className="text-sm font-semibold"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* Actividad reciente */}
            <section>
              <SectionTitle>Actividad reciente</SectionTitle>
              <Card>
                {actividad.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-faint">
                    Todavía no hay actividad.
                  </p>
                ) : (
                  <ul className="divide-y divide-line-soft">
                    {actividad.map((a) => {
                      const u = getUser(a.userId);
                      return (
                        <li
                          key={a.id}
                          className="flex items-start gap-3 px-4 py-3"
                        >
                          <Avatar
                            iniciales={u.iniciales}
                            color={u.color}
                            size={28}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">
                              <strong>{u.nombre.split(" ")[0]}</strong> {a.texto}
                            </p>
                            <p className="text-xs text-ink-faint">
                              {relativeDay(a.fecha)}
                            </p>
                          </div>
                          {a.tipo !== "movimiento" && (
                            <Badge variant="outline">
                              {a.tipo === "miembro"
                                ? "Miembros"
                                : a.tipo === "limite"
                                  ? "Límites"
                                  : "Recurrentes"}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
