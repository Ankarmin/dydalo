"use client";

import { PageError } from "@/components/page-error";

export default function ColaboracionesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} />;
}
