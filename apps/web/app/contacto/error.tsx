"use client";

import { PageError } from "@/components/page-error";

export default function ContactoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} />;
}
