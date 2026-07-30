import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/utils/routes";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad de DYDALO. Conoce cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Política de privacidad" },
            ]}
          />
          <h1 className="page-hero-heading lg:text-6xl">
            POLÍTICA DE PRIVACIDAD
          </h1>
        </div>
      </section>

      <section className="section-px pb-20 pt-8">
        <div className="container-page prose-content">
          <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                1. Datos que Recopilamos
              </h2>
              <p>
                Para procesar tus pedidos y mejorar tu experiencia, recopilamos
                la siguiente información:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Nombre completo y correo electrónico al registrarte.</li>
                <li>
                  Dirección de envío, teléfono y detalles del pedido al
                  realizar una compra.
                </li>
                <li>
                  Información de navegación: páginas visitadas, tiempo en el
                  sitio, dispositivo y navegador utilizado.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                2. Cómo Usamos tus Datos
              </h2>
              <p>Utilizamos tu información para los siguientes fines:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Procesar, confirmar y enviar tus pedidos.</li>
                <li>Enviar notificaciones sobre el estado de tu compra.</li>
                <li>
                  Enviar comunicaciones promocionales (solo si das tu
                  consentimiento).
                </li>
                <li>
                  Mejorar nuestro sitio web y personalizar tu experiencia.
                </li>
                <li>Cumplir con obligaciones legales y fiscales.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                3. Compartir Datos con Terceros
              </h2>
              <p>
                No vendemos ni alquilamos tu información personal. Compartimos
                datos únicamente con:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Proveedores de logística para la entrega de tus pedidos.
                </li>
                <li>
                  Pasarelas de pago para procesar tus transacciones de forma
                  segura.
                </li>
                <li>
                  Autoridades competentes cuando sea requerido por ley.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                4. Cookies
              </h2>
              <p>
                Utilizamos cookies propias y de terceros para mejorar la
                navegación, analizar el tráfico y personalizar el contenido.
                Puedes consultar todos los detalles en nuestra{" "}
                <Link
                  href={ROUTES.cookies}
                  className="font-medium text-accent hover:underline"
                >
                  Política de Cookies
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                5. Tus Derechos
              </h2>
              <p>
                De acuerdo con la Ley de Protección de Datos Personales
                (Ley N° 29733), tienes derecho a:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Acceder a tus datos personales.</li>
                <li>Solicitar la rectificación de datos inexactos.</li>
                <li>Solicitar la supresión de tus datos.</li>
                <li>Oponerte al tratamiento de tus datos.</li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos, contáctanos a
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

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                6. Seguridad
              </h2>
              <p>
                Implementamos medidas técnicas y organizativas para proteger
                tus datos contra accesos no autorizados, pérdida o alteración.
                Sin embargo, ningún sistema es 100% seguro; te recomendamos
                usar contraseñas únicas y no compartir tus credenciales.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                7. Contacto
              </h2>
              <p>
                Si tienes dudas sobre esta política o sobre el tratamiento de
                tus datos, escríbenos a través de nuestro{" "}
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
