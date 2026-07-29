import type { Metadata } from "next";
import { FavoritesPageClient } from "./favorites-page-client";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function FavoritosPage() {
  return <FavoritesPageClient />;
}
