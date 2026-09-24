"use client";

import { useState, useEffect } from "react";
import { blogStore } from "@/lib/stores/data-store.blog";
import type { BlogPost } from "@/lib/stores/data-store.types";
import { isApiEnabled } from "@/lib/api/client";
import { apiGetPosts } from "@/lib/api/catalog";

function localPosts(): BlogPost[] {
  if (typeof window === "undefined") return [];
  return blogStore.getAll();
}

export function useBlogPosts(): BlogPost[] {
  // Inicial SSR-seguro ([] ambos lados); lo local se puebla en el efecto.
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- populate inicial cliente post-hidratación, no suscripción reactiva
    setPosts(localPosts());
    function refreshLocal() {
      if (!isApiEnabled()) setPosts(blogStore.getAll());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshLocal);
    }

    let alive = true;
    if (isApiEnabled()) {
      apiGetPosts()
        .then((list) => {
          if (alive) setPosts(list);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", refreshLocal);
      }
    };
  }, []);

  return posts;
}

export function usePublishedPosts(): BlogPost[] {
  const posts = useBlogPosts();
  return posts.filter((p) => p.published);
}

export function useBlogPostBySlug(slug: string): BlogPost | null {
  const posts = useBlogPosts();
  return posts.find((p) => p.slug === slug && p.published) ?? null;
}
