"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, Pencil } from "lucide-react";
import { useBlogPosts } from "@/hooks/use-blog";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { useParams } from "next/navigation";

interface PostDisplay {
  title: string;
  date: string;
  tag: string;
  body: string[];
  coverImage: string;
  postId?: string;
  published: boolean;
}

const fallback: Record<string, PostDisplay> = {
  "como-combinar-streetwear": {
    title: "Como combinar streetwear sin perder identidad",
    date: "12 Jun 2026",
    tag: "Streetwear",
    body: [
      "El streetwear es mas que ropa: es una declaracion de intenciones. Pero en un mundo donde las tendencias se reciclan cada dos semanas, mantener una identidad propia puede ser un desafio.",
      "La clave esta en entender que las reglas son solo sugerencias. El verdadero flow no se compra en una tienda, se construye con criterio y actitud.",
      "Primer principio: conoce tu silueta. No todas las prendas oversized funcionan en todos los cuerpos. Experimenta con proporciones hasta encontrar lo que te hace sentir poderoso.",
      "Segundo: mezcla alto y bajo. Una pieza statement con basicos bien elegidos siempre gana. No necesitas el fit completo de una marca para hacer ruido.",
      "Tercero: los accesorios mandan. Una gorra bien puesta, una cadena con peso o unas zapatillas limpias pueden transformar un look basico en algo inolvidable.",
      "Y el mas importante: si te sientes comodo, lo estas haciendo bien. El estilo no se impone, se elige. Y esa eleccion es solo tuya.",
    ],
    coverImage: "/images/dydalo-hero-negro.webp",
    published: true,
  },
  "el-renacer-del-bling": {
    title: "El renacer del bling en la cultura urbana",
    date: "10 Jun 2026",
    tag: "Cultura",
    body: [
      "Hubo un tiempo en que las cadenas gruesas y los dijes llamativos eran sinonimo de exceso. Pero el bling ha madurado, y con el, su significado.",
      "Hoy, una pieza de joyeria urbana no grita: susurra. Materiales de calidad, disenos minimalistas con intencion y sobre todo, autenticidad.",
      "En el underground, el bling nunca se fue. Solo estaba esperando que el mainstream dejara de sobre-explotarlo para volver a las raices: piezas que cuentan una historia personal.",
      "Desde los dijes personalizados hasta las cadenas cubanas con eslabones pesados, el nuevo bling es sutil pero inconfundible.",
    ],
    coverImage: "/images/dydalo-hero-negro.webp",
    published: true,
  },
  "zapatillas-que-hicieron-historia": {
    title: "Zapatillas que hicieron historia en el underground",
    date: "08 Jun 2026",
    tag: "Calzado",
    body: [
      "Antes de que las colaboraciones con marcas de lujo fueran norma, las zapatillas ya eran el lenguaje universal de la calle. Cada silueta cuenta una historia.",
      "Las siluetas clasicas de basketball dominaron los 90, pasando de las canchas al asfalto con una naturalidad que nadie anticipo.",
      "En los 2000, las zapatillas tecnicas y las runner invadieron el streetwear. La comodidad se volvio prioridad sin sacrificar el estilo.",
      "En Night Court High recogemos esa herencia: siluetas que respetan el pasado pero miran al frente.",
    ],
    coverImage: "/images/dydalo-hero-negro.webp",
    published: true,
  },
  "el-poder-del-mono-color": {
    title: "El poder del mono-color en el streetwear actual",
    date: "05 Jun 2026",
    tag: "Tendencias",
    body: [
      "Hay una razon por la que el all-black nunca muere: funciona. Pero el mono-color en 2026 va mucho mas alla del negro total.",
      "Tonos tierra, blancos rotos, grises frios. La paleta monocromatica permite jugar con texturas y siluetas sin que el ojo se distraiga con combinaciones de color.",
      "La clave del mono-color esta en los matices: mezclar diferentes tejidos, grosores y caidas dentro de una misma gama cromatica crea profundidad visual sin esfuerzo.",
      "En Pure Form Set llevamos esta filosofia al extremo: basicos de alta calidad en blanco y negro que funcionan como lienzo para construir el fit que quieras.",
    ],
    coverImage: "/images/dydalo-hero-negro.webp",
    published: true,
  },
};

function storePostToDisplay(storePost: ReturnType<typeof useBlogPosts>[number]): PostDisplay {
  return {
    title: storePost.title,
    date: new Date(storePost.createdAt).toLocaleDateString("es-PE", { dateStyle: "medium" }),
    tag: storePost.tags[0] ?? "Blog",
    body: storePost.content.split("\n").filter(Boolean),
    coverImage: storePost.coverImage,
    postId: storePost.id,
    published: storePost.published,
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { meta } = useAuth();
  const allPosts = useBlogPosts();

  const storePost = allPosts.find((p) => p.slug === slug);
  const display: PostDisplay = storePost
    ? storePostToDisplay(storePost)
    : fallback[slug];

  if (!display) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
        <p className="text-sm text-muted-foreground">Articulo no encontrado.</p>
        <Button variant="street" asChild>
          <Link href={ROUTES.blog}>Volver al blog</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="page-root">
      <article className="section-px page-top pb-12 md:pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <PageBreadcrumbs
              className="mb-0"
              items={[
                { label: "Inicio", href: ROUTES.home },
                { label: "Blog", href: ROUTES.blog },
                { label: display.title },
              ]}
            />
            {meta.isAdmin && display.postId && (
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={ROUTES.adminBlogEditar(display.postId)}>
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3" />
              {display.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3" />
              {display.tag}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold uppercase leading-[0.95] tracking-heading md:text-5xl lg:text-6xl">
            {display.title}
            {!display.published && meta.isAdmin && (
              <span className="ml-3 rounded bg-warning/10 px-2 py-1 text-xs font-bold text-warning align-middle">
                Borrador
              </span>
            )}
          </h1>

          <hr className="mt-10 border-border" />

          {display.coverImage && (
            <div className="mt-10 overflow-hidden rounded-xl border border-border">
              <Image
                src={display.coverImage}
                alt={display.title}
                width={1200}
                height={675}
                className="w-full object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            </div>
          )}

          <div className="mt-10 flex flex-col gap-6">
            {display.body.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <hr className="mt-12 border-border" />

          <div className="mt-8">
            <Button variant="hero" size="hero" asChild>
              <Link href={ROUTES.home}>Explorar Catalogo</Link>
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
}
