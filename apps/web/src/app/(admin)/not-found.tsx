import Link from "next/link";
import { ROUTES } from "@/lib/utils/routes";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">Sección no encontrada</p>
        <Link
          href={ROUTES.admin}
          className="inline-block text-sm font-medium text-accent underline underline-offset-4 hover:text-accent/80"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
