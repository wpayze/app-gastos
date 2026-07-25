import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function RecurrentsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-full" />
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    </div>
  );
}
