"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useMounted } from "@/hooks/use-mounted";
import { ROUTES } from "@/lib/utils/routes";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { state, meta } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    if (state.status === "unauthenticated" || (state.status === "authenticated" && !meta.isAdmin)) {
      router.replace(ROUTES.login);
    }
  }, [mounted, state.status, meta.isAdmin, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAuthorized = state.status === "authenticated" && meta.isAdmin;

  if (!isAuthorized) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
