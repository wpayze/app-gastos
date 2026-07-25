import { getActiveBudgetContext } from "@/lib/session/active-budget";
import {
  monthSummary,
  prevMonthSummary,
  topExpenses,
  categorySpending,
  categoryAlerts,
  hasAnyMovements,
  availableMonths,
  movementsByMonth,
} from "@/lib/services/movements.service";
import {
  recurrentsByBudget,
  upcomingRecurrents,
} from "@/lib/services/recurrents.service";
import { recentActivity } from "@/lib/services/activity.service";
import { listCategories } from "@/lib/services/categories.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { currentMonthKey, todayISO } from "@/lib/calendar";
import { isRecurrentPendingForMonth } from "@/lib/recurrents";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;
  const realCurrentMonth = currentMonthKey();
  const month = sp.mes ?? realCurrentMonth;

  const [
    months,
    hasAnyData,
    summary,
    prev,
    gastosTop,
    porCategoriaAll,
    alertas,
    proximos,
    actividad,
    categories,
    profiles,
    allRecurrents,
    currentMonthMovements,
  ] = await Promise.all([
    availableMonths(activeBudgetId),
    hasAnyMovements(activeBudgetId),
    monthSummary(activeBudgetId, month),
    prevMonthSummary(activeBudgetId, month),
    topExpenses(activeBudgetId, month),
    categorySpending(activeBudgetId, month),
    categoryAlerts(activeBudgetId, month),
    upcomingRecurrents(activeBudgetId),
    recentActivity(activeBudgetId, 6),
    listCategories(),
    listProfiles(),
    recurrentsByBudget(activeBudgetId),
    movementsByMonth(activeBudgetId, realCurrentMonth),
  ]);

  const porCategoria = porCategoriaAll.filter((c) => c.gastado > 0).slice(0, 5);

  // Siempre contra el mes real, no el que se esté viendo con el selector:
  // no tiene sentido pedir que "agregues" algo de un mes que ya pasaste a revisar.
  const pendingRecurrentsCount = allRecurrents.filter((r) =>
    isRecurrentPendingForMonth(r, realCurrentMonth, currentMonthMovements),
  ).length;

  return (
    <DashboardView
      key={`${activeBudgetId}-${month}`}
      months={months}
      month={month}
      hasAnyData={hasAnyData}
      summary={summary}
      prev={prev}
      gastosTop={gastosTop}
      porCategoria={porCategoria}
      alertas={alertas}
      proximos={proximos}
      actividad={actividad}
      categories={categories}
      profiles={profiles}
      today={todayISO()}
      pendingRecurrentsCount={pendingRecurrentsCount}
    />
  );
}
