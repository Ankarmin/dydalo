import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dydalo.com"),
  title: "DYDALO — Streetwear premium underground",
  description:
    "Streetwear premium y exclusivo. El estilo no se impone, se elige. Descubre el catálogo DYDALO.",
  authors: [{ name: "DYDALO" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "DYDALO — The Real Cream",
    description: "Streetwear premium y exclusivo para un flow sin límites.",
    type: "website",
    images: [{ url: "/images/dydalo-hero.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#0F0F0F",
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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  var t=localStorage.getItem('dydalo-theme');
                  if(!t){
                    t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';
                  }
                  document.documentElement.setAttribute('data-theme',t);
                }catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-accent-foreground"
        >
          Saltar al contenido
        </a>
        <div id="main-content">
          <Suspense fallback={null}>
            <ThemeProvider>{children}</ThemeProvider>
          </Suspense>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
