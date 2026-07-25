import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function MovementsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Card>
        <SkeletonRows rows={8} />
      </Card>
    </div>
  );
}
