"use client";

import { useSiteConfig } from "@/hooks/use-site-config";

const FALLBACK_FAQS = [
  { question: "¿Cómo realizo un pedido?", answer: "Navega por nuestro catálogo, selecciona los productos que te gustan y contáctanos por Instagram o email para coordinar tu pedido." },
  { question: "¿Cuánto tarda el envío?", answer: "Los envíos nacionales tardan entre 3 y 7 días hábiles dependiendo de tu ubicación." },
  { question: "¿Hacen envíos internacionales?", answer: "Sí, realizamos envíos a toda Latinoamérica. Los tiempos varían según el país de destino." },
  { question: "¿Puedo devolver un producto?", answer: "Aceptamos devoluciones dentro de los 7 días posteriores a la entrega, siempre que el producto esté sin usar y en su empaque original." },
  { question: "¿Cómo sé mi talla?", answer: "Contamos con una guía de tallas detallada en nuestra web. También puedes contactarnos para asesoría personalizada." },
  { question: "¿Métodos de pago?", answer: "Aceptamos transferencias bancarias, Yape, Plin y pagos con tarjeta." },
  { question: "¿Tienen tienda física?", answer: "Por ahora operamos 100% online. Puedes encontrarnos en nuestras redes sociales para conocer nuestros pop-up stores." },
  { question: "¿Cómo los contacto?", answer: "Escríbenos a través de Instagram (@dydalo.oficial) o por email a contacto@dydalo.com." },
  { question: "¿Son productos originales?", answer: "Todos nuestros productos son diseños originales DYDALO, fabricados con materiales de alta calidad." },
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
