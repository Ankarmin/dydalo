import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — DYDALO",
    default: "Cuenta — DYDALO",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
