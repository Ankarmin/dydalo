import Image from "next/image";
import Link from "next/link";
import { LOGO_DARK, LOGO_LIGHT } from "@/config/constants";
import { ROUTES } from "@/lib/utils/routes";
import { NewsletterForm } from "@/components/layout/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <section className="section-px py-14">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 lg:flex-row lg:gap-20">
          <div className="shrink-0">
            <Image src={LOGO_DARK} alt="DYDALO" width={275} height={64} className="h-14 w-auto md:h-16 logo-dark" />
            <Image src={LOGO_LIGHT} alt="DYDALO" width={275} height={64} className="h-14 w-auto md:h-16 logo-light" />
            <p className="mt-6 max-w-xs text-base font-bold tracking-subhead text-accent">
              el estilo no se impone,
              <br />
              se elige.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-xl">
            <div>
              <h4 className="heading-label">Tienda</h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: "Lo último", href: ROUTES.loUltimo },
                  { label: "Polos", href: ROUTES.catalogoCategory("polos") },
                  { label: "Hoodies", href: ROUTES.catalogoCategory("hoodies") },
                  { label: "Jeans", href: ROUTES.catalogoCategory("jeans") },
                  { label: "Accesorios", href: ROUTES.catalogoCategory("accesorios") },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="heading-label">DYDALO</h4>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href={ROUTES.sobreNosotros} className="footer-link">
                    Sobre Nosotros
                  </Link>
                </li>
                {[
                  "Nuestra Historia",
                  "Blog",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="footer-link"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="heading-label">Soporte</h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: "Contacto", href: ROUTES.contacto },
                  { label: "Envíos", href: ROUTES.envios },
                  { label: "Devoluciones", href: ROUTES.devoluciones },
                  { label: "Guía de Tallas", href: ROUTES.guiaDeTallas },
                  { label: "FAQ", href: ROUTES.faq },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border section-px py-10">
        <div className="mx-auto max-w-6xl">
          <NewsletterForm
            id="footer-newsletter-email"
            title="Únete al movimiento"
            description="Sé el primero en enterarte de nuevos drops y exclusivos."
          />
        </div>
      </section>

      <section className="border-t border-border section-px py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 micro-text uppercase tracking-micro text-muted-foreground sm:flex-row">
          <p>© 2026 DYDALO — Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href={ROUTES.terminos} className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href={ROUTES.privacidad} className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href={ROUTES.cookies} className="hover:text-foreground transition-colors">
              Cookies
            </Link>
            <Link href={ROUTES.libroDeReclamaciones} className="hover:text-foreground transition-colors">
              Libro de Reclamaciones
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}
