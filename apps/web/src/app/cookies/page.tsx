import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/utils/routes";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Política de cookies de DYDALO. Conoce qué cookies utilizamos, para qué sirven y cómo puedes gestionarlas.",
};

export default function CookiesPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Política de cookies" },
            ]}
          />
          <h1 className="page-hero-heading lg:text-6xl">
            POLÍTICA DE COOKIES
          </h1>
        </div>
      </section>

      <section className="section-px pb-20 pt-8">
        <div className="container-page prose-content">
          <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                1. ¿Qué son las Cookies?
              </h2>
              <p>
                Las cookies son pequeños archivos de texto que los sitios web
                almacenan en tu dispositivo al navegar. Permiten que el sitio
                recuerde tus preferencias, mejore tu experiencia y recopile
                información sobre el uso del sitio.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                2. Tipos de Cookies que Usamos
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Cookies Esenciales</p>
                  <p>
                    Necesarias para el funcionamiento básico del sitio.
                    Permiten navegar, agregar productos al carrito y procesar
                    pagos. Sin ellas, el sitio no funcionaría correctamente.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Cookies de Rendimiento</p>
                  <p>
                    Recopilan información anónima sobre cómo usas el sitio:
                    páginas visitadas, tiempo de navegación, errores
                    encontrados. Nos ayudan a mejorar continuamente.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Cookies Funcionales</p>
                  <p>
                    Recuerdan tus preferencias: idioma, moneda, productos
                    vistos recientemente y configuración de tema (claro/oscuro).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                3. Cookies de Terceros
              </h2>
              <p>
                Algunos servicios que utilizamos pueden instalar sus propias
                cookies:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Pasarelas de pago: cookies necesarias para procesar
                  transacciones de forma segura.
                </li>
                <li>
                  Herramientas de análisis: para entender el tráfico y
                  comportamiento de los visitantes.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                4. Cómo Gestionar las Cookies
              </h2>
              <p>
                Puedes configurar tu navegador para bloquear o eliminar
                cookies en cualquier momento. Ten en cuenta que al desactivar
                las cookies esenciales, algunas funciones del sitio podrían no
                estar disponibles.
              </p>
              <p className="mt-2">
                Aquí puedes encontrar instrucciones para los navegadores más
                comunes:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Google Chrome: Configuración → Privacidad y seguridad → Cookies</li>
                <li>Safari: Preferencias → Privacidad → Cookies y datos de sitios web</li>
                <li>Firefox: Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
                <li>Edge: Configuración → Cookies y permisos del sitio → Cookies</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                5. Consentimiento
              </h2>
              <p>
                Al utilizar nuestro sitio web, aceptas el uso de cookies de
                acuerdo con esta política. Si no estás de acuerdo, puedes
                desactivarlas siguiendo las instrucciones anteriores o
                abstenerte de usar el sitio.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-base font-bold uppercase tracking-tight text-foreground">
                6. Contacto
              </h2>
              <p>
                Si tienes dudas sobre nuestra política de cookies, contáctanos
                a través de nuestro{" "}
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
