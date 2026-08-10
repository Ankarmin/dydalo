"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { usePublishedPosts, useBlogPosts } from "@/hooks/use-blog";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";

const FALLBACK_POSTS = [
  { slug: "como-combinar-streetwear", title: "Como combinar streetwear sin perder identidad", excerpt: "Reglas no escritas para dominar el arte de mezclar lo urbano con lo personal sin caer en lo generico.", date: "12 Jun 2026", image: "/images/dydalo-hero-negro.webp" },
  { slug: "el-renacer-del-bling", title: "El renacer del bling en la cultura urbana", excerpt: "De simbolo de estatus a declaracion de intenciones. Como las cadenas volvieron a hablar.", date: "10 Jun 2026", image: "/images/dydalo-hero-negro.webp" },
  { slug: "zapatillas-que-hicieron-historia", title: "Zapatillas que hicieron historia en el underground", excerpt: "Siluetas que marcaron generaciones desde la calle. Del basket al asfalto, un recorrido visual.", date: "08 Jun 2026", image: "/images/dydalo-hero-negro.webp" },
  { slug: "el-poder-del-mono-color", title: "El poder del mono-color en el streetwear actual", excerpt: "Menos es mas cuando el fit habla solo. La tendencia monocromatica que domina el 2026.", date: "05 Jun 2026", image: "/images/dydalo-hero-negro.webp" },
];

export function BlogClient() {
  const publishedPosts = usePublishedPosts();
  const allPosts = useBlogPosts();
  const { meta } = useAuth();

  const posts = publishedPosts.length > 0
    ? publishedPosts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, date: new Date(p.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }), image: p.coverImage, id: p.id }))
    : FALLBACK_POSTS;

  return (
    <section className="section-px section-md">
      <div className="container-page">
        {meta.isAdmin && (
          <div className="mb-6 flex justify-end">
            <Button asChild>
              <Link href={ROUTES.adminBlogNuevo}>
                <Plus className="size-4" />
                Nuevo Post
              </Link>
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-0">
          {posts.map((post, index) => {
            const storePost = meta.isAdmin ? allPosts.find((p) => p.slug === post.slug) : null;
            const postId = storePost?.id ?? (post as { id?: string }).id;
            return (
            <article
              key={post.slug}
              className={`group flex flex-col gap-6 border-border py-8 sm:flex-row sm:gap-8 ${index < posts.length - 1 ? "border-b" : ""}`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-square sm:w-48 sm:shrink-0">
                <Image src={post.image} alt={post.title} width={384} height={240} sizes="(max-width: 640px) 100vw, 192px" className="size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground">{post.date}</span>
                  {meta.isAdmin && postId && (
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" asChild>
                      <Link href={ROUTES.adminBlogEditar(postId)} aria-label="Editar post">
                        <Pencil className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
                <Link href={ROUTES.blogPost(post.slug)} className="mt-2 text-xl font-bold uppercase tracking-tight transition-colors hover:text-accent focus-ring sm:text-2xl">
                  {post.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <Link href={ROUTES.blogPost(post.slug)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-accent transition-colors hover:text-accent/80 focus-ring">
                  Leer articulo <span className="text-[10px]">→</span>
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
