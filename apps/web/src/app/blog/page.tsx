import type { Metadata } from 'next';
import { BlogClient } from './blog-client';
import { PageBreadcrumbs } from '@/components/breadcrumbs/page-breadcrumbs';
import { ROUTES } from '@/lib/utils/routes';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'La cultura no se copia, se vive. Artículos sobre streetwear, cultura urbana y estilo.',
};

export default function BlogPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-6"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Blog" },
            ]}
          />
        </div>
        <BlogClient />
      </section>
    </main>
  );
}
