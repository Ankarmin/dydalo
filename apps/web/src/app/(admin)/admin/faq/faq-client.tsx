"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils/utils";
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

function emptyForm(category?: string): FaqForm {
  return { category: category ?? "", question: "", answer: "" };
}

export function FaqClient() {
  const config = useSiteConfig();
  const { state: authState } = useAuth();
  const [faqs, setFaqs] = useState(() => [...config.faq]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FaqForm | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryModal, setNewCategoryModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const cats = [...new Set(config.faq.map((f) => f.category))];
    return new Set(cats);
  });

  const actor = {
    id: authState.user?.id ?? "admin",
    name: authState.user?.name ?? "Admin",
  };

  const grouped = (() => {
    const order = new Map<string, number>();
    faqs.forEach((f) => {
      if (!order.has(f.category)) order.set(f.category, order.size);
    });
    const groups = new Map<string, typeof faqs>();
    faqs.forEach((f) => {
      if (!groups.has(f.category)) groups.set(f.category, []);
      groups.get(f.category)!.push(f);
    });
    return [...groups.entries()].sort(
      ([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0)
    );
  })();

  function openNewFaq(category?: string) {
    setEditing(emptyForm(category));
  }

  function openEdit(item: { id: string; category: string; question: string; answer: string }) {
    setEditing({ id: item.id, category: item.category, question: item.question, answer: item.answer });
  }

  function handleSaveFaq() {
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
        auditStore.create({ actor, entityType: "user", entityId: item.id, entityLabel: item.question, action: "create", summary: `Creo FAQ: ${item.question}`, after: item });
        notifyAdmin("FAQ creada", item.question, "success");
      } else {
        const before = faqs.find((f) => f.id === item.id);
        nextFaqs = faqs.map((f) => (f.id === item.id ? item : f));
        if (before) {
          auditStore.create({ actor, entityType: "user", entityId: item.id, entityLabel: item.question, action: "update", summary: `Edito FAQ: ${item.question}`, before, after: item, changes: auditStore.diffFields(before as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>, ["category", "question", "answer"]) });
        }
        notifyAdmin("FAQ actualizada", item.question, "success");
      }

      configStore.update({ faq: nextFaqs });
      setFaqs(nextFaqs);
      setEditing(null);
      setPending(false);
    }, 400);
  }

  function handleDeleteFaq() {
    if (!deleteId) return;
    const item = faqs.find((f) => f.id === deleteId);
    if (!item) return;
    const next = faqs.filter((f) => f.id !== deleteId);
    auditStore.create({ actor, entityType: "user", entityId: deleteId, entityLabel: item.question, action: "delete", summary: `Elimino FAQ: ${item.question}`, before: item });
    configStore.update({ faq: next });
    setFaqs(next);
    setDeleteId(null);
    notifyAdmin("FAQ eliminada", item.question);
  }

  function moveFaqUp(index: number) {
    const next = [...faqs];
    if (index === 0) return;
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    configStore.update({ faq: next });
    setFaqs(next);
  }

  function moveFaqDown(index: number) {
    const next = [...faqs];
    if (index === faqs.length - 1) return;
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    configStore.update({ faq: next });
    setFaqs(next);
  }

  function moveCategoryUp(categoryName: string) {
    const entries = grouped;
    const idx = entries.findIndex(([n]) => n === categoryName);
    if (idx <= 0) return;
    const prev = entries[idx - 1][0];
    const next = [...faqs];
    const catFaqs = next.filter((f) => f.category === categoryName);
    const prevFaqs = next.filter((f) => f.category === prev);
    const others = next.filter((f) => f.category !== categoryName && f.category !== prev);
    const result = [...others];
    const catStart = result.findIndex((f) => f.category === prev);
    const insertIdx = catStart >= 0 ? catStart : result.length;
    if (catStart >= 0) {
      result.splice(insertIdx, 0, ...catFaqs);
    } else {
      result.unshift(...prevFaqs);
      result.splice(prevFaqs.length, 0, ...catFaqs);
      const prevNewIdx = result.findIndex((f) => f.category === prev);
      const prevItems = result.filter((f) => f.category === prev);
      result.splice(prevNewIdx, prevItems.length);
      result.unshift(...prevItems);
    }
    configStore.update({ faq: result });
    setFaqs(result);
  }

  function moveCategoryDown(categoryName: string) {
    const entries = grouped;
    const idx = entries.findIndex(([n]) => n === categoryName);
    if (idx < 0 || idx >= entries.length - 1) return;
    const next = entries[idx + 1][0];
    moveCategoryUp(next);
  }

  function handleRenameCategory() {
    if (!renamingCategory || !renameCategoryName.trim() || renameCategoryName.trim() === renamingCategory) {
      setRenamingCategory(null);
      return;
    }
    const newName = renameCategoryName.trim();
    const next = faqs.map((f) => (f.category === renamingCategory ? { ...f, category: newName } : f));
    auditStore.create({ actor, entityType: "user", entityId: renamingCategory, entityLabel: `Categoria ${renamingCategory}`, action: "update", summary: `Renombro categoria ${renamingCategory} a ${newName}`, before: { category: renamingCategory }, after: { category: newName }, changes: [{ field: "category", before: renamingCategory, after: newName }] });
    configStore.update({ faq: next });
    setFaqs(next);
    setRenamingCategory(null);
    notifyAdmin("Categoria renombrada", `${renamingCategory} → ${newName}`, "success");
  }

  function handleDeleteCategory() {
    if (!deletingCategory) return;
    const affected = faqs.filter((f) => f.category === deletingCategory);
    const next = faqs.filter((f) => f.category !== deletingCategory);
    auditStore.createMany(affected.map((f) => ({ actor, entityType: "user" as const, entityId: f.id, entityLabel: f.question, action: "delete" as const, summary: `Elimino FAQ por eliminacion de categoria ${deletingCategory}`, before: f })));
    configStore.update({ faq: next });
    setFaqs(next);
    setDeletingCategory(null);
    notifyAdmin("Categoria eliminada", `${deletingCategory} (${affected.length} FAQs)`, "success");
  }

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) { setNewCategoryModal(false); return; }
    if (faqs.some((f) => f.category.toLowerCase() === trimmed.toLowerCase())) {
      notifyAdmin("Categoria duplicada", "Ya existe una categoria con ese nombre", "error");
      return;
    }
    setNewCategoryModal(false);
    setNewCategoryName("");
    setEditing(emptyForm(trimmed));
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">FAQ</h1>
          <p className="text-sm text-muted-foreground">{faqs.length} preguntas en {grouped.length} categorias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewCategoryModal(true)}>
            <Plus className="size-4" />
            Nueva Categoria
          </Button>
          <Button onClick={() => openNewFaq()}>
            <Plus className="size-4" />
            Nueva FAQ
          </Button>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
          No hay FAQs. Crea una categoria para empezar.
        </div>
      )}

      <div className="space-y-3">
        {grouped.map(([category, items]) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <div key={category} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex flex-1 items-center gap-2 text-left min-w-0"
                  aria-label={isExpanded ? "Colapsar categoria" : "Expandir categoria"}
                >
                  <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  <span className="text-xs font-bold uppercase tracking-[0.06em] text-accent">{category}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </button>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => moveCategoryUp(category)} aria-label={`Subir categoria ${category}`}>
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => moveCategoryDown(category)} aria-label={`Bajar categoria ${category}`}>
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => { setRenamingCategory(category); setRenameCategoryName(category); }} aria-label={`Renombrar categoria ${category}`}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeletingCategory(category)} aria-label={`Eliminar categoria ${category}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border">
                  {items.map((faq) => {
                    const globalIndex = faqs.indexOf(faq);
                    return (
                      <div key={faq.id} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors", globalIndex < items.length - 1 + items.indexOf(items[0]) ? "" : "")}>
                        <div className="flex flex-col items-center gap-0.5 pt-0.5">
                          <button onClick={(e) => { e.stopPropagation(); moveFaqUp(globalIndex); }} className="text-muted-foreground hover:text-foreground" aria-label="Subir FAQ">
                            <ChevronUp className="size-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveFaqDown(globalIndex); }} className="text-muted-foreground hover:text-foreground" aria-label="Bajar FAQ">
                            <ChevronDown className="size-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{faq.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(faq)} aria-label="Editar FAQ">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(faq.id)} aria-label="Eliminar FAQ">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-border px-4 py-2">
                    <Button variant="ghost" size="sm" onClick={() => openNewFaq(category)}>
                      <Plus className="size-3.5" />
                      Anadir FAQ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar FAQ" : "Nueva FAQ"}</DialogTitle>
            <DialogDescription>Agrega una pregunta frecuente con su respuesta.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="faq-category">Categoria</Label>
                <Input id="faq-category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Ej: Pedidos, Envios..." disabled={pending} list="faq-categories" className="mt-1.5" />
                <datalist id="faq-categories">
                  {[...new Set(faqs.map((f) => f.category))].map((cat) => (<option key={cat} value={cat} />))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="faq-question">Pregunta</Label>
                <Input id="faq-question" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} placeholder="Escribe la pregunta..." disabled={pending} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="faq-answer">Respuesta</Label>
                <Textarea id="faq-answer" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} placeholder="Escribe la respuesta..." disabled={pending} rows={5} className="mt-1.5" />
              </div>
            </div>
          )}
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={pending}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveFaq} disabled={pending || !editing?.category.trim() || !editing?.question.trim() || !editing?.answer.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing?.id ? "Guardar Cambios" : "Crear FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newCategoryModal} onOpenChange={(o) => { if (!o) { setNewCategoryModal(false); setNewCategoryName(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Categoria</DialogTitle>
            <DialogDescription>Crea una nueva categoria para organizar las FAQs.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="new-cat-name">Nombre</Label>
            <Input id="new-cat-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }} placeholder="Ej: Pedidos, Envios..." className="mt-1.5" autoFocus />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => { setNewCategoryModal(false); setNewCategoryName(""); }}>Cancelar</Button>
            <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Crear Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renamingCategory !== null} onOpenChange={(o) => { if (!o) handleRenameCategory(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renombrar Categoria</DialogTitle>
            <DialogDescription>Cambia el nombre de &quot;{renamingCategory}&quot;. Se actualizara en todas sus FAQs.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="rename-cat-name">Nuevo nombre</Label>
            <Input id="rename-cat-name" value={renameCategoryName} onChange={(e) => setRenameCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRenameCategory(); } }} className="mt-1.5" autoFocus />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenamingCategory(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleRenameCategory} disabled={!renameCategoryName.trim() || renameCategoryName.trim() === renamingCategory}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={handleDeleteFaq} title="Eliminar FAQ" description="Estas seguro de eliminar esta pregunta frecuente?" variant="destructive" />

      <ConfirmDialog open={deletingCategory !== null} onOpenChange={(o) => { if (!o) setDeletingCategory(null); }} onConfirm={handleDeleteCategory} title="Eliminar categoria" description={`Se eliminaran todas las FAQs de la categoria "${deletingCategory}". Esta accion no se puede deshacer.`} variant="destructive" />
    </div>
  );
}
