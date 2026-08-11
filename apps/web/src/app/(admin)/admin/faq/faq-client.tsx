"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { configStore } from "@/lib/stores/data-store.config";
import { auditStore } from "@/lib/stores/data-store.audit";
import { generateId } from "@/lib/stores/data-store.utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { notifyAdmin } from "@/components/admin/admin-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FaqForm {
  id?: string;
  category: string;
  question: string;
  answer: string;
}

function emptyForm(): FaqForm {
  return { category: "", question: "", answer: "" };
}

export function FaqClient() {
  const config = useSiteConfig();
  const { state: authState } = useAuth();
  const [faqs, setFaqs] = useState(() => [...config.faq]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FaqForm | null>(null);
  const [pending, setPending] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const categories = [...new Set(faqs.map((f) => f.category))];

  const actor = {
    id: authState.user?.id ?? "admin",
    name: authState.user?.name ?? "Admin",
  };

  function openNew() {
    setEditing(emptyForm());
  }

  function openEdit(item: { id: string; category: string; question: string; answer: string }) {
    setEditing({ id: item.id, category: item.category, question: item.question, answer: item.answer });
  }

  function handleSave() {
    if (!editing || !editing.category.trim() || !editing.question.trim() || !editing.answer.trim()) return;

    setPending(true);
    setTimeout(() => {
      const isNew = !editing.id;
      const item = {
        id: editing.id ?? generateId(),
        category: editing.category.trim(),
        question: editing.question.trim(),
        answer: editing.answer.trim(),
      };

      let nextFaqs: typeof faqs;

      if (isNew) {
        nextFaqs = [...faqs, item];
        auditStore.create({
          actor,
          entityType: "user",
          entityId: item.id,
          entityLabel: item.question,
          action: "create",
          summary: `Creo FAQ: ${item.question}`,
          after: item,
        });
        notifyAdmin("FAQ creada", item.question, "success");
      } else {
        const before = faqs.find((f) => f.id === item.id);
        nextFaqs = faqs.map((f) => (f.id === item.id ? item : f));
        if (before) {
          auditStore.create({
            actor,
            entityType: "user",
            entityId: item.id,
            entityLabel: item.question,
            action: "update",
            summary: `Edito FAQ: ${item.question}`,
            before,
            after: item,
            changes: auditStore.diffFields(
              before as unknown as Record<string, unknown>,
              item as unknown as Record<string, unknown>,
              ["category", "question", "answer"]
            ),
          });
        }
        notifyAdmin("FAQ actualizada", item.question, "success");
      }

      configStore.update({ faq: nextFaqs });
      setFaqs(nextFaqs);
      setEditing(null);
      setPending(false);
    }, 400);
  }

  function handleDelete() {
    if (!deleteId) return;
    const item = faqs.find((f) => f.id === deleteId);
    if (!item) return;

    const nextFaqs = faqs.filter((f) => f.id !== deleteId);
    auditStore.create({
      actor,
      entityType: "user",
      entityId: deleteId,
      entityLabel: item.question,
      action: "delete",
      summary: `Elimino FAQ: ${item.question}`,
      before: item,
    });
    configStore.update({ faq: nextFaqs });
    setFaqs(nextFaqs);
    setDeleteId(null);
    notifyAdmin("FAQ eliminada", item.question);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...faqs];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    configStore.update({ faq: next });
    setFaqs(next);
  }

  function moveDown(index: number) {
    if (index === faqs.length - 1) return;
    const next = [...faqs];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    configStore.update({ faq: next });
    setFaqs(next);
  }

  function startRenameCategory(name: string) {
    setEditingCategory(name);
    setEditCategoryName(name);
  }

  function addCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      notifyAdmin("Categoria duplicada", "Ya existe una categoria con ese nombre", "error");
      return;
    }
    setEditing({ category: trimmed, question: "", answer: "" });
    setNewCategoryName("");
  }

  function handleRenameCategory() {
    if (!editingCategory || !editCategoryName.trim() || editCategoryName.trim() === editingCategory) {
      setEditingCategory(null);
      return;
    }
    const newName = editCategoryName.trim();
    const next = faqs.map((f) =>
      f.category === editingCategory ? { ...f, category: newName } : f
    );
    auditStore.create({
      actor,
      entityType: "user",
      entityId: editingCategory,
      entityLabel: `Categoria ${editingCategory}`,
      action: "update",
      summary: `Renombro categoria ${editingCategory} a ${newName}`,
      before: { category: editingCategory },
      after: { category: newName },
      changes: [{ field: "category", before: editingCategory, after: newName }],
    });
    configStore.update({ faq: next });
    setFaqs(next);
    setEditingCategory(null);
    notifyAdmin("Categoria renombrada", `${editingCategory} → ${newName}`, "success");
  }

  function handleDeleteCategory() {
    if (!deletingCategory) return;
    const affected = faqs.filter((f) => f.category === deletingCategory);
    const next = faqs.filter((f) => f.category !== deletingCategory);
    auditStore.createMany(
      affected.map((f) => ({
        actor,
        entityType: "user" as const,
        entityId: f.id,
        entityLabel: f.question,
        action: "delete" as const,
        summary: `Elimino FAQ por eliminacion de categoria ${deletingCategory}`,
        before: f,
      }))
    );
    configStore.update({ faq: next });
    setFaqs(next);
    setDeletingCategory(null);
    notifyAdmin("Categoria eliminada", `${deletingCategory} (${affected.length} FAQs)`, "success");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">FAQ</h1>
          <p className="text-sm text-muted-foreground">{faqs.length} preguntas frecuentes</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Nueva FAQ
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Categorias ({categories.length})</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nueva categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                className="h-8 w-40 text-xs"
              />
              <Button variant="outline" size="sm" onClick={addCategory}>
                <Plus className="size-3" />
                Anadir
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-1">
                {editingCategory === cat ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCategory();
                        if (e.key === "Escape") setEditingCategory(null);
                      }}
                      onBlur={handleRenameCategory}
                      autoFocus
                      className="h-8 w-32 text-xs"
                    />
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-[0.06em] text-accent">
                    {cat}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => startRenameCategory(cat)}
                  aria-label={`Renombrar categoria ${cat}`}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive hover:text-destructive"
                  onClick={() => setDeletingCategory(cat)}
                  aria-label={`Eliminar categoria ${cat}`}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium w-10">#</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 font-medium">Pregunta</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Respuesta</th>
                <th className="px-3 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq, index) => (
                <tr key={faq.id} className="border-b border-border text-sm hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-xs w-4">{index + 1}</span>
                      <div className="flex flex-col">
                        <button onClick={() => moveUp(index)} className="text-muted-foreground hover:text-foreground text-xs leading-none px-0.5" aria-label="Subir">
                          <ChevronUp className="size-3" />
                        </button>
                        <button onClick={() => moveDown(index)} className="text-muted-foreground hover:text-foreground text-xs leading-none px-0.5" aria-label="Bajar">
                          <ChevronDown className="size-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-[0.06em] text-accent">{faq.category}</span>
                  </td>
                  <td className="px-3 py-2 font-medium max-w-[200px] truncate">
                    {faq.question}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[300px] truncate hidden sm:table-cell">
                    {faq.answer}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(faq)} aria-label="Editar">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(faq.id)} aria-label="Eliminar">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td                     colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No hay FAQs. Crea la primera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar FAQ" : "Nueva FAQ"}</DialogTitle>
            <DialogDescription>
              Agrega una pregunta frecuente con su respuesta.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="faq-category">Categoria</Label>
                <Input
                  id="faq-category"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="Ej: Pedidos, Envios..."
                  disabled={pending}
                  list="faq-categories"
                  className="mt-1.5"
                />
                <datalist id="faq-categories">
                  {[...new Set(faqs.map((f) => f.category))].map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="faq-question">Pregunta</Label>
                <Input
                  id="faq-question"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  placeholder="Escribe la pregunta..."
                  disabled={pending}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="faq-answer">Respuesta</Label>
                <Textarea
                  id="faq-answer"
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  placeholder="Escribe la respuesta..."
                  disabled={pending}
                  rows={5}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending || !editing?.category.trim() || !editing?.question.trim() || !editing?.answer.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing?.id ? "Guardar Cambios" : "Crear FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Eliminar FAQ"
        description="Estas seguro de eliminar esta pregunta frecuente?"
        variant="destructive"
      />

      <ConfirmDialog
        open={deletingCategory !== null}
        onOpenChange={(o) => { if (!o) setDeletingCategory(null); }}
        onConfirm={handleDeleteCategory}
        title="Eliminar categoria"
        description={`Se eliminaran todas las FAQs de la categoria "${deletingCategory}". Esta accion no se puede deshacer.`}
        variant="destructive"
      />
    </div>
  );
}
