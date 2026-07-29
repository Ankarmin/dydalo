import { Skeleton } from "@/components/ui/skeleton";

export default function ProductoLoading() {
  return (
    <main className="page-root">
      <section className="section-px pb-20 pt-24 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="md:grid md:grid-cols-2 md:gap-10">
            <div className="relative">
              <Skeleton className="aspect-square w-full rounded-xl" />
            </div>

            <div className="mt-8 flex flex-col space-y-6 md:mt-0">
              <Skeleton className="h-4 w-64" />

              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="size-7 shrink-0 rounded-lg" />
              </div>

              <Skeleton className="h-8 w-28" />

              <Skeleton className="h-5 w-20" />

              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="size-8 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-3 w-12" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-12" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-11 w-32" />
              </div>

              <div className="space-y-2 border-t border-border pt-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              <Skeleton className="mt-auto h-16 w-full" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
