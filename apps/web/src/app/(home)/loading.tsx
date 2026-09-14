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

      <section className="section-px pt-14 md:pt-20">
        <Skeleton className="mb-3 h-5 w-28" />
        <Skeleton className="mb-8 h-12 w-72 md:mb-12" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      </section>

      <section className="section-px section-lg">
        <Skeleton className="mb-12 h-6 w-32" />
        <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
