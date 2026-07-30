"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { getImageFileError } from "@/lib/validations/forms";

type ImageUploaderProps = {
  value: string;
  onChange: (base64: string) => void;
  disabled?: boolean;
};

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    const fileError = getImageFileError(file);
    setError(fileError);
    if (fileError) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setError(null);
    onChange("");
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="object-cover w-full h-full" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 size-7"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Eliminar imagen"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Subir imagen. Arrastra una imagen o haz clic para seleccionar"
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
            dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Arrastra una imagen o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="hidden"
        disabled={disabled}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
