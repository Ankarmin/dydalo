import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EASY — Streetwear premium underground",
  description:
    "Streetwear premium y exclusivo. El estilo no se impone, se elige. Descubre el catálogo EASY.",
  authors: [{ name: "EASY" }],
  openGraph: {
    title: "EASY — The Real Cream",
    description: "Streetwear premium y exclusivo para un flow sin límites.",
    type: "website",
    images: [{ url: "/images/easy-hero.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-accent-foreground"
        >
          Saltar al contenido
        </a>
        <div id="main-content">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
