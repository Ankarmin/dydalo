"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/layout/site-header";
import { SocialWidget } from "@/components/layout/SocialWidget";
import { useMounted } from "@/hooks/use-mounted";

function ShellInner() {
  const pathname = usePathname();
  const { meta } = useAuth();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <>
        <SiteHeader />
        <SocialWidget />
      </>
    );
  }

  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute && meta.isAdmin) return null;

  return (
    <>
      <SiteHeader />
      <SocialWidget />
    </>
  );
}

export function ConditionalShell() {
  return (
    <Suspense fallback={null}>
      <ShellInner />
    </Suspense>
  );
}
