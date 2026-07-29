"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/layout/site-header";
import { SocialWidget } from "@/components/layout/SocialWidget";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsentBanner } from "@/components/cookies/cookie-consent-banner";
import { useMounted } from "@/hooks/use-mounted";

function ShellInner() {
  const pathname = usePathname();
  const { meta } = useAuth();
  const mounted = useMounted();
  const isAdminRoute = pathname.startsWith("/admin");

  if (!mounted) {
    if (isAdminRoute) return null;
    return (
      <>
        <SiteHeader />
        <SocialWidget />
      </>
    );
  }

  if (isAdminRoute && meta.isAdmin) return null;

  return (
    <>
      <SiteHeader />
      <SocialWidget />
      <CookieConsentBanner />
    </>
  );
}

function FooterInner() {
  const pathname = usePathname();
  const { meta } = useAuth();
  const mounted = useMounted();

  if (!mounted) return null;

  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute && meta.isAdmin) return null;

  return <SiteFooter />;
}

export function ConditionalShell() {
  return (
    <Suspense fallback={null}>
      <ShellInner />
    </Suspense>
  );
}

export function ConditionalFooter() {
  return (
    <Suspense fallback={null}>
      <FooterInner />
    </Suspense>
  );
}
