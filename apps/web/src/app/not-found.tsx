import Link from "next/link";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { LOGO_DARK } from "@/config/constants";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Image src={LOGO_DARK} alt="DYDALO" width={140} height={33} className="h-8 w-auto" />
      <p className="text-8xl font-black tracking-[-0.06em] text-muted-foreground/15">404</p>
      <h1 className="text-2xl font-bold tracking-heading">Página no encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        La página que buscas no existe o fue movida. Vuelve al inicio para seguir explorando.
      </p>
      <Button asChild variant="hero" className="mt-4">
        <Link href={ROUTES.home}>Volver al inicio</Link>
      </Button>
    </main>
  );
}
