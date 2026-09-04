import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/admin/categorias/:path*",
        destination: "/admin/configuracion/categorias/:path*",
        permanent: true,
      },
      {
        source: "/admin/faq",
        destination: "/admin/configuracion/faq",
        permanent: true,
      },
      {
        source: "/admin/blog/:path*",
        destination: "/admin/configuracion/blog/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
