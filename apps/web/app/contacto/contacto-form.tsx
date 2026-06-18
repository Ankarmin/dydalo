'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

const reasons = ['Pedido', 'Devolución', 'Prensa', 'Colaboración', 'Otro'];

export function ContactoForm() {
  const [selectedReason, setSelectedReason] = useState('Pedido');
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value ?? '';
    if (!email) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
          <Send className="size-6 text-accent" />
        </div>
        <h2 className="mt-6 text-2xl font-bold uppercase tracking-tight">
          Mensaje enviado
        </h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Te respondemos en menos de 24 horas. Mientras tanto, revisa nuestra{' '}
          <Link href={ROUTES.faq} className="text-accent hover:underline">
            FAQ
          </Link>
          .
        </p>
        <Button variant="street" asChild className="mt-6">
          <Link href={ROUTES.home}>Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="form-label">
        ¿Qué necesitas?
      </label>
      <div className="flex flex-wrap gap-2">
        {reasons.map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() => setSelectedReason(reason)}
            className={`flex h-10 items-center justify-center border px-4 text-xs font-bold uppercase transition-colors ${
              selectedReason === reason
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            {reason}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="contact-name"
            className="form-label"
          >
            Nombre
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Tu nombre"
            required
            className="form-input w-full"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="form-label"
          >
            Email
          </label>
          <input
            id="contact-email"
            ref={emailRef}
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            className="form-input w-full"
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="form-label"
          >
            Mensaje
          </label>
          <textarea
            id="contact-message"
            rows={4}
            placeholder="Cuéntanos qué necesitas..."
            required
            className="form-input w-full resize-none"
          />
        </div>
      </div>

      <Button type="submit" variant="hero" size="hero" className="mt-8 w-full">
        Enviar mensaje <Send />
      </Button>
    </form>
  );
}
