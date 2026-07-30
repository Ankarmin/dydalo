"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { getImageFileError } from "@/lib/validations/forms";

type MultiImageUploaderProps = {
  value: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
};

export function MultiImageUploader({ value, onChange, disabled }: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | File[]) {
    const allFiles = Array.from(files);
    const invalidFile = allFiles.find((file) => getImageFileError(file));
    if (invalidFile) {
      setError(getImageFileError(invalidFile));
      return;
    }

    const imageFiles = allFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setError(null);

    Promise.all(
      imageFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.readAsDataURL(file);
          }),
      ),
    ).then((images) => {
      onChange([...value, ...images.filter(Boolean)]);
    });
  }

  function removeImage(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {value.map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Imagen adicional ${index + 1}`} className="size-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 size-7"
                onClick={() => removeImage(index)}
                disabled={disabled}
                aria-label={`Eliminar imagen adicional ${index + 1}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Agregar imágenes. Arrastra imágenes o haz clic para seleccionar"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors sm:p-6",
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <ImagePlus className="size-7 text-muted-foreground" />
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Agrega imágenes adicionales para la galería
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
