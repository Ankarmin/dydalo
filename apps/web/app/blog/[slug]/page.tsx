import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';

const postTitles: Record<string, string> = {
  'como-combinar-streetwear': 'Cómo combinar streetwear sin perder identidad',
  'el-renacer-del-bling': 'El renacer del bling en la cultura urbana',
  'zapatillas-que-hicieron-historia': 'Zapatillas que hicieron historia en el underground',
  'el-poder-del-mono-color': 'El poder del mono-color en el streetwear actual',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = postTitles[slug];
  return {
    title: title ? `${title}` : 'Artículo',
  };
}
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

const postContent: Record<string, { title: string; date: string; tag: string; body: string[] }> = {
  'como-combinar-streetwear': {
    title: 'Cómo combinar streetwear sin perder identidad',
    date: '12 Jun 2026',
    tag: 'Streetwear',
    body: [
      'El streetwear es más que ropa: es una declaración de intenciones. Pero en un mundo donde las tendencias se reciclan cada dos semanas, mantener una identidad propia puede ser un desafío.',
      'La clave está en entender que las reglas son solo sugerencias. El verdadero flow no se compra en una tienda, se construye con criterio y actitud.',
      'Primer principio: conoce tu silueta. No todas las prendas oversized funcionan en todos los cuerpos. Experimenta con proporciones hasta encontrar lo que te hace sentir poderoso.',
      'Segundo: mezcla alto y bajo. Una pieza statement con básicos bien elegidos siempre gana. No necesitas el fit completo de una marca para hacer ruido.',
      'Tercero: los accesorios mandan. Una gorra bien puesta, una cadena con peso o unas zapatillas limpias pueden transformar un look básico en algo inolvidable.',
      'Y el más importante: si te sientes cómodo, lo estás haciendo bien. El estilo no se impone, se elige. Y esa elección es solo tuya.',
    ],
  },
  'el-renacer-del-bling': {
    title: 'El renacer del bling en la cultura urbana',
    date: '10 Jun 2026',
    tag: 'Cultura',
    body: [
      'Hubo un tiempo en que las cadenas gruesas y los dijes llamativos eran sinónimo de exceso. Pero el bling ha madurado, y con él, su significado.',
      'Hoy, una pieza de joyería urbana no grita: susurra. Materiales de calidad, diseños minimalistas con intención y sobre todo, autenticidad.',
      'En el underground, el bling nunca se fue. Solo estaba esperando que el mainstream dejara de sobre-explotarlo para volver a las raíces: piezas que cuentan una historia personal.',
      'Desde los dijes personalizados hasta las cadenas cubanas con eslabones pesados, el nuevo bling es sutil pero inconfundible. Es el detalle que separa un fit genérico de uno con personalidad.',
      'En DYDALO lo entendemos así: cada pieza de nuestra colección Cold Cuban Ice está pensada para ser el centro de atención sin necesidad de pedirlo.',
    ],
  },
  'zapatillas-que-hicieron-historia': {
    title: 'Zapatillas que hicieron historia en el underground',
    date: '08 Jun 2026',
    tag: 'Calzado',
    body: [
      'Antes de que las colaboraciones con marcas de lujo fueran norma, las zapatillas ya eran el lenguaje universal de la calle. Cada silueta cuenta una historia.',
      'Las siluetas clásicas de basketball dominaron los 90, pasando de las canchas al asfalto con una naturalidad que nadie anticipó. Eran funcionales, accesibles y tenían actitud.',
      'En los 2000, las zapatillas técnicas y las runner invadieron el streetwear. La comodidad se volvió prioridad sin sacrificar el estilo. El gris y el plata dominaban las calles.',
      'Hoy, la escena está más fragmentada que nunca: chunky sneakers, siluetas esbeltas, materiales reciclados, ediciones limitadas. Pero el principio sigue siendo el mismo: las zapatillas correctas pueden definir un look entero.',
      'En Night Court High recogemos esa herencia: siluetas que respetan el pasado pero miran al frente. Porque lo que pisas dice tanto como lo que vistes.',
    ],
  },
  'el-poder-del-mono-color': {
    title: 'El poder del mono-color en el streetwear actual',
    date: '05 Jun 2026',
    tag: 'Tendencias',
    body: [
      'Hay una razón por la que el all-black nunca muere: funciona. Pero el mono-color en 2026 va mucho más allá del negro total.',
      'Tonos tierra, blancos rotos, grises fríos. La paleta monocromática permite jugar con texturas y siluetas sin que el ojo se distraiga con combinaciones de color.',
      'La clave del mono-color está en los matices: mezclar diferentes tejidos, grosores y caídas dentro de una misma gama cromática crea profundidad visual sin esfuerzo.',
      'Un fit completamente blanco en verano, un total look en tono arena para el día a día, o un negro absoluto con detalles en charol para la noche. El mono-color es versátil, elegante y, sobre todo, fácil.',
      'En Pure Form Set llevamos esta filosofía al extremo: básicos de alta calidad en blanco y negro que funcionan como lienzo para construir el fit que quieras.',
    ],
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postContent[slug];

  if (!post) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-5 text-center">
        <p className="text-sm text-muted-foreground">Artículo no encontrado.</p>
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
          <Link
            href={ROUTES.blog}
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-micro text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-3.5" />
            Blog
          </Link>
          <div className="flex items-center gap-4 micro-text uppercase tracking-micro text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3" />
              {post.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3" />
              {post.tag}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold uppercase leading-[0.95] tracking-heading md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          <hr className="mt-10 border-border" />

          <div className="mt-10 flex flex-col gap-6">
            {post.body.map((paragraph, index) => (
              <p key={index} className="body-text">
                {paragraph}
              </p>
            ))}
          </div>

          <hr className="mt-12 border-border" />

          <div className="mt-8">
            <Button variant="hero" size="hero" asChild>
              <Link href={ROUTES.home}>Explorar Catálogo</Link>
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
}
