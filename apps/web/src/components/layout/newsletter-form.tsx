"use client";

import { useRef, useState } from "react";

export function NewsletterForm({
  id = "newsletter-email",
  title = "Próximos lanzamientos",
  description = "Sé el primero en enterarte de nuevos drops y lanzamientos exclusivos.",
  buttonText = "Suscribir",
}: {
  id?: string;
  title?: string;
  description?: string;
  buttonText?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (submitted) {
    return (
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-micro text-accent">
          Gracias
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Te avisaremos cuando haya novedades.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
      <div className="text-center md:text-left">
        <p className="heading-label">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = inputRef.current?.value ?? "";
          if (email) {
            setSubmitted(true);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
        className="flex w-full max-w-sm"
      >
        <label htmlFor={id} className="sr-only">
          Correo electronico
        </label>
        <input
          id={id}
          type="email"
          placeholder="tu@email.com"
          ref={inputRef}
          className="form-input flex-1"
        />
        <button type="submit" className="newsletter-btn">
          {buttonText}
        </button>
      </form>
    </div>
  );
}
