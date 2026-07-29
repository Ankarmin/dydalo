import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogoLoading() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <Skeleton className="mb-6 h-4 w-40" />

        <div className="space-y-24">
          {Array.from({ length: 3 }).map((_, ci) => (
            <div key={ci}>
              <Skeleton className="mb-1 h-8 w-32" />
              <Skeleton className="mb-8 h-3 w-20" />

              <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, pi) => (
                  <div key={pi} className="space-y-4">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
