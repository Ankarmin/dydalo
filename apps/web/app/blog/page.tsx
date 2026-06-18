import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'La cultura no se copia, se vive. Artículos sobre streetwear, cultura urbana y estilo.',
};

const posts = [
  {
    slug: 'como-combinar-streetwear',
    title: 'Cómo combinar streetwear sin perder identidad',
    excerpt:
      'Reglas no escritas para dominar el arte de mezclar lo urbano con lo personal sin caer en lo genérico.',
    date: '12 Jun 2026',
    tag: 'Streetwear',
    image: '/images/dydalo-hero.jpg',
  },
  {
    slug: 'el-renacer-del-bling',
    title: 'El renacer del bling en la cultura urbana',
    excerpt:
      'De símbolo de estatus a declaración de intenciones. Cómo las cadenas volvieron a hablar.',
    date: '10 Jun 2026',
    tag: 'Cultura',
    image: '/images/dydalo-hero.jpg',
  },
  {
    slug: 'zapatillas-que-hicieron-historia',
    title: 'Zapatillas que hicieron historia en el underground',
    excerpt:
      'Siluetas que marcaron generaciones desde la calle. Del basket al asfalto, un recorrido visual.',
    date: '08 Jun 2026',
    tag: 'Calzado',
    image: '/images/dydalo-hero.jpg',
  },
  {
    slug: 'el-poder-del-mono-color',
    title: 'El poder del mono-color en el streetwear actual',
    excerpt:
      'Menos es más cuando el fit habla solo. La tendencia monocromática que domina el 2026.',
    date: '05 Jun 2026',
    tag: 'Tendencias',
    image: '/images/dydalo-hero.jpg',
  },
];

export default function BlogPage() {
  return (
    <main className="page-root">

      <section className="page-hero">
        <div className="container-page">
          <p className="overline">Blog</p>
          <h1 className="page-hero-heading">
            La cultura no se copia, se vive.
          </h1>
        </div>
      </section>

      <section className="section-px py-16">
        <div className="container-page">
          <div className="flex flex-col gap-0">
            {posts.map((post, index) => (
              <article
                key={post.slug}
                className={`flex flex-col gap-6 border-border py-8 sm:flex-row sm:gap-8 ${
                  index < posts.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-square sm:w-48 sm:shrink-0">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={384}
                    height={240}
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="size-full object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <span className="micro-label">
                      {post.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {post.date}
                    </span>
                  </div>

                  <Link
                    href={ROUTES.blogPost(post.slug)}
                    className="mt-2 text-xl font-bold uppercase tracking-tight transition-colors hover:text-accent focus-ring sm:text-2xl"
                  >
                    {post.title}
                  </Link>

                  <p className="mt-2 line-clamp-2 body-sm">
                    {post.excerpt}
                  </p>

                  <Link
                    href={ROUTES.blogPost(post.slug)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-accent transition-colors hover:text-accent/80 focus-ring"
                  >
                    Leer artículo
                    <span className="text-[10px]">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
