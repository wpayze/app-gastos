import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { recurrentsByBudget } from "@/lib/services/recurrents.service";
import { listCategories } from "@/lib/services/categories.service";
import { movementsByMonth } from "@/lib/services/movements.service";
import { currentMonthKey, todayISO } from "@/lib/calendar";
import { RecurrentsView } from "@/components/recurrents/recurrents-view";

export default async function RecurrentsPage() {
  const { activeBudgetId } = await getActiveBudgetContext();
  const month = currentMonthKey();
  const [recurrents, categories, movementsThisMonth] = await Promise.all([
    recurrentsByBudget(activeBudgetId),
    listCategories(),
    movementsByMonth(activeBudgetId, month),
  ]);

  return (
    <RecurrentsView
      key={activeBudgetId}
      budgetId={activeBudgetId}
      initialRecurrents={recurrents}
      categories={categories}
      movementsThisMonth={movementsThisMonth}
      month={month}
      today={todayISO()}
    />
  );
}
