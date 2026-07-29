import type { Metadata } from "next";
import { FavoritesPageClient } from "./favorites-page-client";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function FavoritosPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <PageBreadcrumbs
          className="mb-6"
          items={[
            { label: "Home", href: ROUTES.home },
            { label: "Favoritos" },
          ]}
        />
        <FavoritesPageClient />
      </section>
    </main>
  );
}
