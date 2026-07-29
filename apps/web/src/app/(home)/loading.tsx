import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="page-root">
      <div className="flex min-h-[60vh] items-center justify-center section-px">
        <div className="w-full max-w-2xl space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-16 w-full max-w-lg" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </div>

      <div className="overflow-hidden border-y border-border bg-accent py-3">
        <Skeleton className="mx-auto h-4 w-96 bg-accent-foreground/20" />
      </div>

      <section className="section-px section-lg">
        <Skeleton className="mb-12 h-6 w-32" />
        <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
