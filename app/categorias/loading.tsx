import { Card, Skeleton } from "@/components/ui/primitives";

export default function CategoriesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-48 rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="space-y-3 p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
        ))}
      </div>
    </div>
  );
}
