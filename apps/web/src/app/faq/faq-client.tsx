"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Trash2, Loader2, Plus } from "lucide-react";
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
  question: string;
  answer: string;
}

function emptyForm(): FaqForm {
  return { question: "", answer: "" };
}

export function FaqClient() {
  const config = useSiteConfig();
  const { state: authState, meta } = useAuth();
  const [faqs, setFaqs] = useState(() => [...config.faq]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FaqForm | null>(null);
  const [pending, setPending] = useState(false);

  const actor = {
    id: authState.user?.id ?? "admin",
    name: authState.user?.name ?? "Admin",
  };

  function openNew() {
    setEditing(emptyForm());
  }

  function openEdit(item: { id: string; question: string; answer: string }) {
    setEditing({ id: item.id, question: item.question, answer: item.answer });
  }

  function handleSave() {
    if (!editing || !editing.question.trim() || !editing.answer.trim()) return;

    setPending(true);
    setTimeout(() => {
      const isNew = !editing.id;
      const item = {
        id: editing.id ?? generateId(),
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
        nextFaqs = faqs.map((f) => (f.id === item.id ? item : f));
        const before = faqs.find((f) => f.id === item.id);
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
              ["question", "answer"]
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

  const isEmpty = faqs.length === 0;

  return (
    <section className="section-px section-md">
      <div className="container-page">
        {meta.isAdmin && (
          <div className="mb-6 flex justify-end">
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Nueva FAQ
            </Button>
          </div>
        )}

        {isEmpty && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay preguntas frecuentes disponibles.
          </p>
        )}

        <div className="flex flex-col gap-0">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className={cn(
                  "border-border transition-colors",
                  index < faqs.length - 1 && "border-b"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {meta.isAdmin && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(faq);
                          }}
                          aria-label="Editar FAQ"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(faq.id);
                          }}
                          aria-label="Eliminar FAQ"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                    <span className="text-sm font-bold uppercase tracking-tight">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200",
                    isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm leading-relaxed text-muted-foreground pr-8">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
                <Label htmlFor="pub-faq-question">Pregunta</Label>
                <Input
                  id="pub-faq-question"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  placeholder="Escribe la pregunta..."
                  disabled={pending}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pub-faq-answer">Respuesta</Label>
                <Textarea
                  id="pub-faq-answer"
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
            <Button size="sm" onClick={handleSave} disabled={pending || !editing?.question.trim() || !editing?.answer.trim()}>
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
    </section>
  );
}
