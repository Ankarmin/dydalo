import type { Metadata, Viewport } from "next";
import { Oswald, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { CookieConsentProvider } from "@/contexts/cookie-consent-context";
import { ConditionalShell, ConditionalFooter } from "@/components/layout/conditional-shell";
import { SITE_NAME, SITE_DEFAULT_TITLE, SITE_DESCRIPTION, BRAND_SUBTITLE, FALLBACK_IMAGE, THEME_STORAGE_KEY } from "@/config/constants";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F0F0F",
};

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
      className={`${spaceGrotesk.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-dark-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-dark-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-dark.png" />
        <link rel="icon" href="/favicon-dark.ico" />
        <link rel="manifest" href="/site-dark.webmanifest" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script id="theme-script" strategy="beforeInteractive">
          {`(function(){
            try{
              var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'dark';
              document.documentElement.setAttribute('data-theme',t);
            }catch(e){
              document.documentElement.setAttribute('data-theme','dark');
            }
          })();`}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <CookieConsentProvider>
                  <ConditionalShell />
                  <div id="main-content">
                    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" /></div>}>{children}</Suspense>
                  </div>
                  <ConditionalFooter />
                  <Toaster />
                </CookieConsentProvider>
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
