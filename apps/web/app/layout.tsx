import type { Metadata } from "next";
import { Space_Grotesk, Permanent_Marker } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
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
      className={`${spaceGrotesk.variable} ${permanentMarker.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
