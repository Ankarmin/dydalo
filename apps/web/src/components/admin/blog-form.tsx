"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { blogStore } from "@/lib/stores/data-store.blog";
import { auditStore } from "@/lib/stores/data-store.audit";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { normalizeText } from "@/lib/validations/forms";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const formSchema = z.object({
  title: z.string().trim().min(5, "Mínimo 5 caracteres").max(120, "Máximo 120 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  excerpt: z.string().trim().min(10, "Mínimo 10 caracteres").max(180, "Máximo 180 caracteres"),
  content: z.string().trim().min(50, "Mínimo 50 caracteres"),
  coverImage: z.string(),
  tags: z.array(z.string().trim().min(1)).min(1, "Al menos un tag"),
  published: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.published && !data.coverImage.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Imagen requerida para publicar",
      path: ["coverImage"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: [],
  published: true,
};

interface BlogFormProps {
  postId?: string;
}

export function BlogForm({ postId }: BlogFormProps) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isEdit = postId !== undefined;
  const post = isEdit ? blogStore.getById(postId) : undefined;
  const notFound = isEdit && !post;
  const [isPending, setIsPending] = useState(false);
  const [newTag, setNewTag] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!post) return;
    form.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      tags: post.tags,
      published: post.published,
    });
  }, [post, form]);

  const tags = useWatch({ control: form.control, name: "tags" }) as string[];

  function addTag() {
    if (!newTag.trim()) return;
    const trimmed = newTag.trim().toLowerCase();
    if (tags.includes(trimmed)) return;
    form.setValue("tags", [...tags, trimmed], { shouldValidate: true });
    setNewTag("");
  }

  function removeTag(index: number) {
    form.setValue(
      "tags",
      tags.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  }

  function handleTitleChange(value: string) {
    form.setValue("title", value, { shouldValidate: true });
    const currentSlug = form.getValues("slug");
    if (!isEdit || currentSlug === generateSlug(defaultValues.title)) {
      form.setValue("slug", generateSlug(value), { shouldValidate: true });
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    const actor = {
      id: authState.user?.id ?? "admin",
      name: authState.user?.name ?? "Admin",
    };

    const normalizedValues = {
      ...values,
      title: normalizeText(values.title),
      slug: generateSlug(values.slug),
      excerpt: normalizeText(values.excerpt),
      authorId: actor.id,
      authorName: actor.name,
      tags: values.tags.map((tag) => normalizeText(tag).toLowerCase()),
    };
    const slugExists = blogStore
      .getAll()
      .some((existingPost) => existingPost.id !== postId && existingPost.slug === normalizedValues.slug);

    if (slugExists) {
      form.setError("slug", { message: "Ya existe un post con este slug" });
      return;
    }

    setIsPending(true);

    setTimeout(() => {
      if (isEdit) {
        const before = post;
        const updated = blogStore.update(postId!, normalizedValues);
        if (updated) {
          const changes = before
            ? auditStore.diffFields(
                before as unknown as Record<string, unknown>,
                updated as unknown as Record<string, unknown>,
                ["title", "slug", "excerpt", "content", "coverImage", "authorName", "tags", "published"]
              )
            : [];

          if (changes.length > 0) {
            auditStore.create({
              actor,
              entityType: "blog",
              entityId: updated.id,
              entityLabel: updated.title,
              action: "update",
              summary: `Editó post ${updated.title}`,
              before,
              after: updated,
              changes,
            });
          }
          notifyAdmin("Post actualizado", updated.title, "success");
        }
      } else {
        const created = blogStore.create(normalizedValues);
        auditStore.create({
          actor,
          entityType: "blog",
          entityId: created.id,
          entityLabel: created.title,
          action: "create",
          summary: `Creó post ${created.title}`,
          after: created,
        });
        notifyAdmin("Post creado", created.title, "success");
      }
      router.push(ROUTES.adminBlog);
    }, ADMIN_FORM_SIMULATED_DELAY_MS);
  });

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Post no encontrado</h2>
          <Link
            href={ROUTES.adminBlog}
            className="text-accent underline text-sm"
          >
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminBlog}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            {isEdit ? "Editar Post" : "Nuevo Post"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? `Slug: ${form.getValues("slug")}`
              : "El slug se generará automáticamente del título"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Información</h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Título del post"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="slug-del-post"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extracto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Breve descripción del post"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagen de portada</FormLabel>
                  <FormControl>
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Tags</h2>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="gap-1 pr-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                      disabled={isPending}
                      aria-label={`Eliminar tag ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isPending}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={isPending}
              >
                <Plus className="size-3.5" /> Añadir
              </Button>
            </div>
            {form.formState.errors.tags && (
              <p className="text-sm text-destructive">
                {form.formState.errors.tags.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Contenido</h2>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Escribe el contenido del post..."
                      disabled={isPending}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Configuración</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Publicado</p>
                <p className="text-xs text-muted-foreground">
                  Visible en el blog público
                </p>
              </div>
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" asChild>
              <Link href={ROUTES.adminBlog}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar Cambios" : "Crear Post"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
