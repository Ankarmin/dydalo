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
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Blog" },
            ]}
          />
          <h1 className="page-hero-heading">
            La cultura no se copia, se vive.
          </h1>
        </div>
      </section>
      <BlogClient />
    </main>
  );
}
