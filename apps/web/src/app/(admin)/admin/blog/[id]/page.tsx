"use client";

import { use } from "react";
import { BlogForm } from "@/components/admin/blog-form";

export default function BlogEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BlogForm postId={id} />;
}
