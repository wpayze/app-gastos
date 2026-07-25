import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { listCategories } from "@/lib/services/categories.service";
import {
  categorySpending,
  movementsByMonth,
} from "@/lib/services/movements.service";
import { currentMonthKey, monthLabel } from "@/lib/calendar";
import { CategoriesView } from "@/components/categories/categories-view";

export default async function CategoriesPage() {
  const { activeBudgetId } = await getActiveBudgetContext();
  const month = currentMonthKey();

  const [categories, spending, movements] = await Promise.all([
    listCategories(),
    categorySpending(activeBudgetId, month),
    movementsByMonth(activeBudgetId, month),
  ]);

  // Estadísticas de ingresos por categoría: no hay servicio dedicado (solo
  // este panel las necesita), así que se calculan aquí de una pasada.
  const ingresoStats: Record<string, { total: number; count: number }> = {};
  for (const m of movements) {
    if (m.tipo !== "ingreso") continue;
    const cur = ingresoStats[m.categoriaId] ?? { total: 0, count: 0 };
    cur.total += m.cantidad;
    cur.count += 1;
    ingresoStats[m.categoriaId] = cur;
  }

  return (
    <CategoriesView
      key={activeBudgetId}
      budgetId={activeBudgetId}
      initialCategories={categories}
      initialSpending={spending}
      ingresoStats={ingresoStats}
      monthLabelText={monthLabel(month)}
    />
  );
}
