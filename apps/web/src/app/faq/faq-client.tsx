"use client";

import { useSiteConfig } from "@/hooks/use-site-config";

const FALLBACK_FAQS = [
  { question: "¿Cuánto tarda el envío?", answer: "Lima Metropolitana: 2-3 días hábiles (envío gratis). Provincia vía Olva: 5-12 días hábiles (costo desde S/ 15)." },
  { question: "¿Hacen envíos a todo el Perú?", answer: "Sí. Envíos gratis en Lima Metropolitana y envíos a provincia vía Olva." },
  { question: "¿Puedo devolver un producto?", answer: "Aceptamos devoluciones dentro de los 7 días posteriores a la entrega, siempre que el producto esté sin usar y en su empaque original." },
  { question: "¿Métodos de pago?", answer: "Aceptamos Yape, Plin, transferencia bancaria y tarjetas de crédito o débito." },
  { question: "¿Cómo elijo mi talla?", answer: "Revisa nuestra guía de tallas con medidas en centímetros para cada tipo de prenda." },
  { question: "¿Necesito crear una cuenta para comprar?", answer: "Sí. El registro es gratis y toma menos de un minuto." },
  { question: "¿Los productos son originales?", answer: "Todos nuestros productos son diseños originales DYDALO, fabricados con materiales de alta calidad." },
  { question: "¿Cómo los contacto?", answer: "Escríbenos a través de nuestro formulario de contacto en la web o por Instagram @dydalo.oficial." },
];

export function FaqClient() {
  const config = useSiteConfig();
  const faqs = config.faq.length > 0 ? config.faq : FALLBACK_FAQS;

  return (
    <div className="space-y-2 max-w-2xl">
      {faqs.map((faq, i) => (
        <details key={i} className="group rounded-xl border border-border bg-card">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold uppercase tracking-micro select-none">
            {faq.question}
          </summary>
          <div className="px-5 pb-4 text-sm text-muted-foreground">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
