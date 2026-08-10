import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/utils/routes";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones de DYDALO. Presenta tu queja o reclamo de acuerdo con la normativa vigente en Perú.",
  robots: { index: false },
};

export default function LibroDeReclamacionesPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Libro de reclamaciones" },
            ]}
          />
          <h1 className="page-hero-heading lg:text-6xl">
            LIBRO DE RECLAMACIONES
          </h1>
        </div>
      </section>

      <section className="section-px pb-20 pt-8">
        <div className="container-page prose-content">
          <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                ¿Cómo Presentar un Reclamo?
              </h2>
              <p>
                De acuerdo con el Código de Protección y Defensa del
                Consumidor (Ley N° 29571), tienes derecho a presentar una queja
                o reclamo sobre los productos o servicios adquiridos.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>
                  Completa nuestro{" "}
                  <Link
                    href={ROUTES.contacto}
                    className="font-medium text-accent hover:underline"
                  >
                    formulario de contacto
                  </Link>{" "}
                  seleccionando el motivo &quot;Reclamo&quot;.
                </li>
                <li>
                  Incluye la siguiente información:
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    <li>Nombre completo y DNI.</li>
                    <li>Número de pedido (si aplica).</li>
                    <li>Descripción detallada del reclamo.</li>
                    <li>Producto o servicio involucrado.</li>
                    <li>Fecha del incidente.</li>
                  </ul>
                </li>
                <li>
                  Recibirás un acuse de recibo con un número de seguimiento.
                </li>
              </ol>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                Plazos de Respuesta
              </h2>
              <p>
                Nos comprometemos a responder tu reclamo en un plazo máximo de
                15 días hábiles, contados desde la recepción del mismo. En caso
                de requerir información adicional, te contactaremos al correo
                electrónico registrado.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                ¿No Estás Conforme con Nuestra Respuesta?
              </h2>
              <p>
                Si consideras que tu reclamo no fue atendido satisfactoriamente,
                puedes acudir al Instituto Nacional de Defensa de la Competencia
                y de la Protección de la Propiedad Intelectual (INDECOPI) a
                través de sus canales oficiales.
              </p>
              <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">INDECOPI</p>
                <p className="mt-1">
                  Web:{" "}
                  <a
                    href="https://www.indecopi.gob.pe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    www.indecopi.gob.pe
                  </a>
                </p>
                <p>
                  Teléfono: (01) 224-7777 (Lima) / 0-800-4-4040 (provincias)
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                Contacto Directo
              </h2>
              <p>
                Para iniciar tu reclamo o consultar el estado de uno existente,
                escríbenos a través de nuestro{" "}
                <Link
                  href={ROUTES.contacto}
                  className="font-medium text-accent hover:underline"
                >
                  formulario de contacto
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
