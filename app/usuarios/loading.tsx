import { Card, Skeleton, SkeletonRows } from "@/components/ui/primitives";

export default function UsersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    </div>
  );
}
