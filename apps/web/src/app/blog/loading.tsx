import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-14 w-full max-w-xl md:h-20" />
        </div>
      </section>

      <section className="section-px section-md">
        <div className="container-page">
          <div className="flex flex-col gap-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <article
                key={i}
                className={`flex flex-col gap-6 border-border py-8 sm:flex-row sm:gap-8 ${i < 3 ? "border-b" : ""}`}
              >
                <Skeleton className="aspect-[16/10] w-full sm:aspect-square sm:w-48 sm:shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col justify-center space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-1 h-3 w-28" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
