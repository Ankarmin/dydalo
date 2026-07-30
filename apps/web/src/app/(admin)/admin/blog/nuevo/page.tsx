import type { Metadata } from "next";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = {
  title: "Nuevo Post",
};

export default function BlogNuevoPage() {
  return <BlogForm />;
}
