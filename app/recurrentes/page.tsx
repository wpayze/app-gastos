import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { recurrentsByBudget } from "@/lib/services/recurrents.service";
import { listCategories } from "@/lib/services/categories.service";
import { todayISO } from "@/lib/calendar";
import { RecurrentsView } from "@/components/recurrents/recurrents-view";

export default async function RecurrentsPage() {
  const { activeBudgetId } = await getActiveBudgetContext();
  const [recurrents, categories] = await Promise.all([
    recurrentsByBudget(activeBudgetId),
    listCategories(),
  ]);

  return (
    <RecurrentsView
      key={activeBudgetId}
      budgetId={activeBudgetId}
      initialRecurrents={recurrents}
      categories={categories}
      today={todayISO()}
    />
  );
}
