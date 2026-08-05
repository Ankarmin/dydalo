"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { blogStore } from "@/lib/stores/data-store.blog";
import { auditStore } from "@/lib/stores/data-store.audit";
import { seedIfEmpty } from "@/config/seed-data";
import type { BlogPost } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SortableHeader, defaultSort, type SortState } from "@/components/admin/sortable-header";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { AdminPagination } from "@/components/admin/admin-pagination";

const PAGE_SIZE = 15;

export function BlogClient() {
  seedIfEmpty();
  const { state: authState } = useAuth();
  const actor = { id: authState.user?.id ?? "admin", name: authState.user?.name ?? "Admin" };
  const [posts, setPosts] = useState<BlogPost[]>(() => blogStore.getAll());
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(defaultSort);

  const filtered = useMemo(() => {
    let result = posts;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort.field) {
      result = [...result].sort((a, b) => {
        const dir = sort.direction === "asc" ? 1 : -1;
        switch (sort.field) {
          case "title":
            return dir * a.title.localeCompare(b.title);
          case "author":
            return dir * a.author.localeCompare(b.author);
          case "createdAt":
            return (
              dir *
              (new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime())
            );
          default:
            return 0;
        }
      });
    }
    return result;
  }, [posts, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function togglePublished(post: BlogPost) {
    const updated = blogStore.update(post.id, { published: !post.published });
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
      auditStore.create({
        actor,
        entityType: "blog",
        entityId: post.id,
        entityLabel: post.title,
        action: updated.published ? "activate" : "deactivate",
        summary: `${updated.published ? "Publicó" : "Ocultó"} post ${post.title}`,
        before: { published: post.published },
        after: { published: updated.published },
        changes: [{ field: "published", before: post.published, after: updated.published }],
      });
      notifyAdmin(
        updated.published ? "Post publicado" : "Post ocultado",
        post.title
      );
    }
  }

  function handleDelete() {
    if (deleteId === null) return;
    const post = blogStore.getById(deleteId);
    const ok = blogStore.delete(deleteId);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      if (post) {
        auditStore.create({
          actor,
          entityType: "blog",
          entityId: post.id,
          entityLabel: post.title,
          action: "delete",
          summary: `Eliminó post ${post.title}`,
          before: post,
        });
      }
      notifyAdmin("Post eliminado");
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Blog</h1>
          <p className="text-sm text-muted-foreground">
            {query
              ? `${filtered.length} de ${posts.length} posts`
              : `${posts.length} posts totales`}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.adminBlogNuevo}>
            <Plus className="size-4" />
            Nuevo Post
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título o tag..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <SortableHeader
                  label="Título"
                  field="title"
                  currentSort={sort}
                  onSortChange={setSort}
                />
                <SortableHeader
                  label="Autor"
                  field="author"
                  currentSort={sort}
                  onSortChange={setSort}
                />
                <th className="px-3 py-2 font-medium">
                  Tags
                </th>
                <SortableHeader
                  label="Fecha"
                  field="createdAt"
                  currentSort={sort}
                  onSortChange={setSort}
                />
                <th className="px-3 py-2 font-medium">Publicado</th>
                <th className="px-3 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border text-sm hover:bg-muted/30"
                >
                  <td className="px-3 py-2">
                    <div className="min-w-0">
                      <Link
                        href={ROUTES.adminBlogEditar(post.id)}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {post.excerpt}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.author}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(post.createdAt).toLocaleDateString("es-PE", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={post.published}
                      onCheckedChange={() => togglePublished(post)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link
                          href={ROUTES.adminBlogEditar(post.id)}
                          aria-label="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(post.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    {query
                      ? "No se encontraron posts con los filtros actuales"
                      : "No hay posts. ¡Crea el primero!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar post"
        description="¿Estás seguro de eliminar este post? Esta acción no se puede deshacer."
        variant="destructive"
      />
    </div>
  );
}
