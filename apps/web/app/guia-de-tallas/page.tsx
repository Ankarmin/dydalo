import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Ruler } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guía de Tallas — DYDALO',
  description: 'Que el número no te engañe. Medidas reales en cm para ropa y calzado. Encuentra tu talla exacta.',
};
import { Button } from '@/components/ui/button';
import { GuiaTabs } from './guia-tabs';

export default function GuiaDeTallasPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="page-header">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/"
            className="back-link"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      <section className="asphalt section-px pb-8 pt-20">
        <div className="container-page">
          <p className="overline">Guía de Tallas</p>
          <h1 className="page-hero-heading">
            Que el número no te engañe.
          </h1>
          <p className="mt-6 max-w-xl body-text">
            Medidas reales, sin trucos. Encuentra tu talla exacta en segundos.
          </p>
        </div>
      </section>

      <section className="section-px pt-12">
        <div className="mx-auto max-w-3xl">
          <GuiaTabs />
        </div>
      </section>

      <section className="border-t border-border section-px py-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-border p-6">
              <div className="flex items-start gap-3">
                <Ruler className="size-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">
                    ¿Entre dos tallas?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Elige la más grande. El streetwear se lleva con espacio.
                    Mejor oversize que ajustado.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center text-sm font-bold text-accent">
                  ?
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">
                    ¿No te convence?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Escríbenos. Te ayudamos a elegir sin compromiso.
                  </p>
                  <Button variant="street" size="sm" asChild className="mt-3">
                    <Link href="/contacto">Contacto</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
