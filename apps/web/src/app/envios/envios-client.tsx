"use client";

import { useSiteConfig } from "@/hooks/use-site-config";

export function EnviosClient() {
  const config = useSiteConfig();
  return (
    <section className="section-px pb-16">
      <div className="max-w-3xl">
        <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: config.shippingInfo }} />
      </div>
    </section>
  );
}
