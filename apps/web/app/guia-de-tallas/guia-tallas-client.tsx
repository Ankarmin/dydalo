"use client";

import { useSiteConfig } from "@/lib/use-site-config";

export function GuiaTallasClient() {
  const config = useSiteConfig();
  if (!config.sizeGuide) return null;
  return (
    <div className="prose prose-sm dark:prose-invert max-w-3xl" dangerouslySetInnerHTML={{ __html: config.sizeGuide }} />
  );
}
