import type { Metadata } from "next";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = {
  title: "Editar Post",
};

export default async function BlogEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogForm postId={id} />;
}
