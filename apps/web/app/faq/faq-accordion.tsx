'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    category: 'Pedidos',
    question: '¿Cuánto tarda el envío?',
    answer:
      'Express: 1-2 días laborables. Estándar: 3-5 días. Internacional: 7-14 días. Envíos gratis en pedidos superiores a $150.',
  },
  {
    category: 'Pedidos',
    question: '¿Puedo modificar mi pedido después de pagar?',
    answer:
      'Tienes 1 hora tras el pago para modificar tu pedido. Escríbenos a contacto y lo gestionamos sin problema.',
  },
  {
    category: 'Pedidos',
    question: '¿Cómo sé si mi pedido ha sido enviado?',
    answer:
      'Recibirás un email de confirmación con el número de tracking en cuanto tu pedido salga del almacén.',
  },
  {
    category: 'Envíos',
    question: '¿Hacen envíos internacionales?',
    answer:
      'Sí. Envíos a más de 30 países. El coste se calcula en el checkout según país de destino. Las aduanas locales no están incluidas.',
  },
  {
    category: 'Envíos',
    question: '¿Cómo sigo mi pedido?',
    answer:
      'Usa el número de tracking que recibiste por email en la web de la empresa de mensajería. Si no lo encuentras, revisa spam o escríbenos.',
  },
  {
    category: 'Cambios',
    question: '¿Puedo cambiar de talla o color?',
    answer:
      'Sí. Tienes 30 días para cambios sin coste. Solo asegúrate de que la prenda esté sin usar y con etiquetas originales.',
  },
  {
    category: 'Cambios',
    question: '¿Cuánto tarda un reembolso?',
    answer:
      '5-7 días hábiles desde que recibimos la devolución en nuestro almacén. Recibirás una notificación en cuanto se procese.',
  },
  {
    category: 'Pagos',
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Tarjeta de crédito/débito, PayPal, Apple Pay, Google Pay y transferencia bancaria.',
  },
  {
    category: 'Pagos',
    question: '¿Es seguro pagar en vuestra web?',
    answer:
      'Totalmente. Usamos cifrado SSL y no almacenamos datos de pago. Tus datos están protegidos en todo momento.',
  },
];

const categories = ['Todos', 'Pedidos', 'Envíos', 'Cambios', 'Pagos'];

export function FaqAccordion() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs =
    activeCategory === 'Todos'
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  return (
    <>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías de FAQ">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'default' : 'street'}
            size="sm"
            onClick={() => {
              setActiveCategory(category);
              setOpenIndex(null);
            }}
            role="tab"
            aria-selected={activeCategory === category}
            className="uppercase tracking-[0.12em]"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="mt-12">
        {filteredFaqs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay preguntas en esta categoría aún.
          </p>
        ) : (
          <div className="flex flex-col">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const globalIndex = faqs.indexOf(faq);

              return (
                <div
                  key={globalIndex}
                  className={`border-border ${
                    index < filteredFaqs.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-accent focus-ring"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <span className="micro-label">
                        {faq.category}
                      </span>
                      <h3 className="mt-1 text-base font-bold">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 pb-5' : 'max-h-0'
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
