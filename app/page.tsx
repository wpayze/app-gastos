import { getActiveBudgetContext } from "@/lib/session/active-budget";
import {
  monthSummary,
  prevMonthSummary,
  topExpenses,
  categorySpending,
  categoryAlerts,
  hasAnyMovements,
  availableMonths,
} from "@/lib/services/movements.service";
import { upcomingRecurrents } from "@/lib/services/recurrents.service";
import { recentActivity } from "@/lib/services/activity.service";
import { listCategories } from "@/lib/services/categories.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { currentMonthKey, todayISO } from "@/lib/calendar";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;
  const month = sp.mes ?? currentMonthKey();

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
  ]);

  const porCategoria = porCategoriaAll.filter((c) => c.gastado > 0).slice(0, 5);

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
    />
  );
}
