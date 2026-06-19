import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme";
import { CartProvider } from "@/contexts/cart-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { SiteHeader } from "@/components/site-header";
import { SocialWidget } from "@/components/SocialWidget";
import { SITE_NAME, SITE_DEFAULT_TITLE, SITE_DESCRIPTION, BRAND_SUBTITLE, FALLBACK_IMAGE, THEME_STORAGE_KEY } from "@/lib/constants";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dydalo.com"),
  title: {
    template: `%s — ${SITE_NAME}`,
    default: SITE_DEFAULT_TITLE,
  },
  description: `${SITE_DESCRIPTION} Descubre el catálogo ${SITE_NAME}.`,
  authors: [{ name: SITE_NAME }],
  openGraph: {
    title: `${SITE_NAME} — ${BRAND_SUBTITLE}`,
    description: SITE_DESCRIPTION,
    type: "website",
    images: [{ url: FALLBACK_IMAGE, width: 1200, height: 630 }],
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
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-dark-16x16.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-light-16x16.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-dark-32x32.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-light-32x32.png" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-light.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-dark.ico" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon-light.ico" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/site-dark.webmanifest" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/site-light.webmanifest" media="(prefers-color-scheme: light)" />
        <Script id="theme-script" strategy="beforeInteractive">
          {`(function(){
            try{
              var t=localStorage.getItem('${THEME_STORAGE_KEY}');
              if(!t){t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}
              document.documentElement.setAttribute('data-theme',t);
            }catch(e){}
          })();`}
        </Script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider>
          <CartProvider>
            <FavoritesProvider>
              <SiteHeader />
              <div id="main-content">
                <Suspense fallback={null}>{children}</Suspense>
              </div>
              <Toaster />
              <SocialWidget />
            </FavoritesProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
