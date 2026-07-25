import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { monthSummary, hasAnyMovements } from "@/lib/services/movements.service";
import { currentMonthKey, monthLabel } from "@/lib/calendar";
import { BudgetsView } from "@/components/budgets/budgets-view";

export default async function BudgetsPage() {
  const { budgets, activeBudgetId } = await getActiveBudgetContext();
  const month = currentMonthKey();

  const summaries = await Promise.all(
    budgets.map(async (b) => {
      const [summary, hasData] = await Promise.all([
        monthSummary(b.id, month),
        hasAnyMovements(b.id),
      ]);
      return { budgetId: b.id, summary, hasData };
    }),
  );

  return (
    <BudgetsView
      budgets={budgets}
      activeBudgetId={activeBudgetId}
      summaries={summaries}
      monthLabelText={monthLabel(month)}
    />
  );
}
