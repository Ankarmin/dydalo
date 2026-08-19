import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/utils/routes";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso del sitio web de DYDALO. Información sobre productos, precios, envíos, devoluciones y propiedad intelectual.",
};

export default function TerminosPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-20">
        <div className="container-page prose-content">
          <PageBreadcrumbs
            className="mb-6"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Términos y condiciones" },
            ]}
          />
          <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                1. Introducción
              </h2>
              <p>
                Al acceder y utilizar el sitio web de DYDALO aceptas los presentes
                términos y condiciones. Si no estás de acuerdo con alguna parte,
                te recomendamos no utilizar nuestros servicios.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                2. Productos y Servicios
              </h2>
              <p>
                Todos los productos ofrecidos en DYDALO están sujetos a
                disponibilidad. Nos reservamos el derecho de modificar o
                descontinuar cualquier producto sin previo aviso. Las imágenes
                de los productos son de referencia y los colores pueden variar
                ligeramente según la pantalla de tu dispositivo.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                3. Precios y Pagos
              </h2>
              <p>
                Todos los precios están expresados en soles peruanos (PEN) e
                incluyen IGV. Nos reservamos el derecho de modificar precios en
                cualquier momento. Los precios vigentes al momento de la compra
                son los que aplican. Aceptamos los métodos de pago indicados en
                el proceso de compra.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                4. Envíos y Entregas
              </h2>
              <p>
                Realizamos envíos a todo el Perú. Los pedidos dentro de Lima
                Metropolitana tienen envío gratis con entrega en 2-3 días
                hábiles. Para provincia, los envíos se realizan vía Olva con
                un costo desde S/ 15 y entrega en 5-12 días hábiles. Consulta
                nuestra{" "}
                <Link
                  href={ROUTES.envios}
                  className="font-medium text-accent hover:underline"
                >
                  Política de Envíos
                </Link>{" "}
                para más información sobre costos y cobertura.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                5. Devoluciones y Reembolsos
              </h2>
              <p>
                Aceptamos devoluciones dentro de los 7 días posteriores a la
                entrega, siempre que el producto se encuentre en su estado
                original, sin usar y con etiquetas. Los gastos de envío por
                devolución corren por cuenta del cliente salvo que el producto
                presente fallas de fábrica. Consulta nuestra{" "}
                <Link
                  href={ROUTES.devoluciones}
                  className="font-medium text-accent hover:underline"
                >
                  Política de Devoluciones
                </Link>{" "}
                para el proceso completo.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                6. Propiedad Intelectual
              </h2>
              <p>
                Todo el contenido del sitio web —incluyendo textos, imágenes,
                logotipos, gráficos, diseños y código— es propiedad exclusiva de
                DYDALO o de sus licenciantes y está protegido por las leyes de
                propiedad intelectual. Queda prohibida su reproducción,
                distribución o modificación sin autorización expresa por escrito.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                7. Limitación de Responsabilidad
              </h2>
              <p>
                DYDALO no será responsable por daños indirectos, incidentales o
                consecuentes derivados del uso o la imposibilidad de uso de
                nuestros productos o sitio web. Nuestra responsabilidad máxima
                se limita al valor del producto adquirido.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                8. Modificaciones
              </h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en
                cualquier momento. Los cambios entrarán en vigor desde su
                publicación en el sitio web. Te recomendamos revisar
                periódicamente esta sección.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                9. Contacto
              </h2>
              <p>
                Para cualquier consulta sobre estos términos, escríbenos a
                través de nuestro{" "}
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
