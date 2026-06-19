import type { Metadata } from "next";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Mi Cuenta",
};

export default function CuentaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">MI PERFIL</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tu información personal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nombre de usuario</p>
              <p className="text-sm text-muted-foreground">
                Disponible al conectar con backend
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                Disponible al conectar con backend
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
            Pedidos recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no tienes pedidos. Cuando realices tu primera compra aparecerán aquí.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={ROUTES.catalogo}>VER CATÁLOGO</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
