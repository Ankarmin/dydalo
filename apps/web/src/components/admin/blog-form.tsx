"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { blogStore } from "@/lib/stores/data-store.blog";
import { auditStore } from "@/lib/stores/data-store.audit";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  title: z.string().trim().min(5, "Minimo 5 caracteres").max(120, "Maximo 120 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "Minimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minusculas, numeros y guiones"),
  excerpt: z.string().trim().min(10, "Minimo 10 caracteres").max(180, "Maximo 180 caracteres"),
  content: z.string().trim().min(50, "Minimo 50 caracteres"),
  coverImage: z.string(),
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
  published: true,
};

interface BlogFormProps {
  postId?: string;
}

export function BlogForm({ postId }: BlogFormProps) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isEdit = postId !== undefined;
  const post = useMemo(
    () => (isEdit ? blogStore.getById(postId!) : undefined),
    [isEdit, postId],
  );
  const notFound = isEdit && !post;
  const [isPending, setIsPending] = useState(false);

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
      published: post.published,
    });
  }, [post, form]);

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
                ["title", "slug", "excerpt", "content", "coverImage", "authorName", "published"]
              )
            : [];

          if (changes.length > 0) {
            auditStore.create({
              actor,
              entityType: "blog",
              entityId: updated.id,
              entityLabel: updated.title,
              action: "update",
              summary: `Edito post ${updated.title}`,
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
          summary: `Creo post ${created.title}`,
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
              : "El slug se generara automaticamente del titulo"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Informacion</h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Titulo del post"
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
                        placeholder="Breve descripcion del post"
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
            <h2 className="text-sm font-semibold">Configuracion</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Publicado</p>
                <p className="text-xs text-muted-foreground">
                  Visible en el blog publico
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
