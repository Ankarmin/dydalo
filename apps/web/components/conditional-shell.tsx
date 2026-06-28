"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SocialWidget } from "@/components/SocialWidget";

function ShellInner() {
  const pathname = usePathname();
  const { meta } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
