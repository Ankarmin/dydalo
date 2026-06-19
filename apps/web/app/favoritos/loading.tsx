import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritosLoading() {
  return (
    <main className="mx-auto max-w-6xl section-px page-top page-bottom">
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
