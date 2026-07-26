import { getActiveBudgetContext } from "@/lib/session/active-budget";
import { activityByBudget } from "@/lib/services/activity.service";
import { listProfiles } from "@/lib/services/profiles.service";
import { todayISO } from "@/lib/calendar";
import { ActivityView } from "@/components/activity/activity-view";

export const metadata = { title: "Actividad" };

const PAGE_SIZE = 20;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { activeBudgetId } = await getActiveBudgetContext();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);

  const [{ items, total, pageSize }, profiles] = await Promise.all([
    activityByBudget(activeBudgetId, page, PAGE_SIZE),
    listProfiles(),
  ]);

  return (
    <ActivityView
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      profiles={profiles}
      today={todayISO()}
    />
  );
}
