import Image from 'next/image';
import { ContactoForm } from './contacto-form';
import type { Metadata } from 'next';
import { PageBreadcrumbs } from '@/components/breadcrumbs/page-breadcrumbs';
import { ROUTES } from '@/lib/utils/routes';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Háblanos directo. Sin formularios eternos, sin respuestas automáticas. Un equipo real al otro lado.',
};

export default function ContactoPage() {
  return (
    <main className="page-root">
      <div className="section-px pt-24">
        <PageBreadcrumbs
          className="mb-4"
          items={[
            { label: "Inicio", href: ROUTES.home },
            { label: "Contacto" },
          ]}
        />
      </div>
      <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="relative h-64 lg:h-auto">
          <Image
            src="/images/dydalo-hero-negro.webp"
            alt="Contacto DYDALO"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-background/50" />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-12">
            <p className="text-3xl font-bold uppercase leading-[0.92] tracking-[-0.04em] lg:text-4xl">
              Háblanos
              <br />
              directo.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/70">
              Sin formularios eternos. Sin respuestas automáticas. Un equipo
              real al otro lado.
            </p>
          </div>
        </div>

        <div className="flex items-center section-px py-12 lg:py-0">
          <div className="mx-auto w-full max-w-md">
            <div className="mt-8 lg:mt-20">
              <ContactoForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
