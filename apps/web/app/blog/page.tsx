import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { Metadata } from 'next';
import { BlogClient } from './blog-client';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'La cultura no se copia, se vive. Artículos sobre streetwear, cultura urbana y estilo.',
};

export default function BlogPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <p className="section-tag">Blog</p>
          <h1 className="page-hero-heading">
            La cultura no se copia, se vive.
          </h1>
        </div>
      </section>
      <BlogClient />
    </main>
  );
}
