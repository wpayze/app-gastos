import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="hidden h-16 sm:block" />
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SkeletonRows rows={4} />
        </Card>
        <Card>
          <SkeletonRows rows={4} />
        </Card>
        <Card>
          <SkeletonRows rows={3} />
        </Card>
        <Card>
          <SkeletonRows rows={3} />
        </Card>
      </div>
    </div>
  );
}
