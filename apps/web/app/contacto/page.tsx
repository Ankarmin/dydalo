import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto — EASY',
  description: 'Háblanos directo. Sin formularios eternos, sin respuestas automáticas. Un equipo real al otro lado.',
};
import { ContactoForm } from './contacto-form';

export default function ContactoPage() {
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

      <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src="/images/easy-hero.jpg"
            alt="Contacto EASY"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-background/50" />
          <div className="absolute inset-x-0 bottom-0 p-12">
            <p className="text-4xl font-bold uppercase leading-[0.92] tracking-[-0.04em]">
              Háblanos
              <br />
              directo.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/70">
              Sin formularios eternos. Sin respuestas automáticas. Un equipo
              real al otro lado.
            </p>
          </div>
        </div>

        <div className="flex items-center section-px pt-20 pb-12 lg:pt-0">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <p className="overline">Contacto</p>
              <h1 className="page-hero-heading">
                Háblanos directo.
              </h1>
              <p className="mt-6 text-sm text-muted-foreground">
                Sin formularios eternos. Sin respuestas automáticas.
              </p>
            </div>

            <div className="mt-8 lg:mt-20">
              <ContactoForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
