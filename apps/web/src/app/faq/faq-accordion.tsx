'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    category: "Pedidos",
    question: "¿Cómo realizo un pedido?",
    answer:
      "Explora nuestro catálogo, selecciona la talla y color que prefieras, agrega al carrito y finaliza la compra completando tus datos de envío.",
  },
  {
    category: "Pedidos",
    question: "¿Puedo modificar mi pedido después de pagar?",
    answer:
      "Tienes 1 hora tras el pago para solicitar cambios. Escríbenos por el formulario de contacto incluyendo tu número de pedido y lo gestionamos.",
  },
  {
    category: "Pedidos",
    question: "¿Cómo sé si mi pedido fue confirmado?",
    answer:
      "Recibirás un email de confirmación con el resumen de tu compra en cuanto el pago sea procesado exitosamente.",
  },
  {
    category: "Pedidos",
    question: "¿Puedo cancelar un pedido?",
    answer:
      "Sí, siempre que aún no haya sido enviado. Escríbenos por contacto indicando tu número de pedido y lo cancelamos sin costo.",
  },
  {
    category: "Pedidos",
    question: "¿Hay un pedido mínimo?",
    answer:
      "No. Puedes comprar desde un solo producto sin monto mínimo.",
  },

  {
    category: "Envíos",
    question: "¿Cuánto tarda el envío?",
    answer:
      "Lima Metropolitana: 2-3 días hábiles con envío gratis. Provincia vía Olva: 5-12 días hábiles con costo desde S/ 15.",
  },
  {
    category: "Envíos",
    question: "¿El envío es gratis en todos los pedidos?",
    answer:
      "El envío es gratis solo en Lima Metropolitana. Para provincia, el costo varía según peso y destino y lo asume el cliente.",
  },
  {
    category: "Envíos",
    question: "¿Hacen envíos a todo el Perú?",
    answer:
      "Sí. Realizamos envíos a todo el territorio nacional: gratis en Lima y vía Olva para provincia.",
  },
  {
    category: "Envíos",
    question: "¿Cómo rastreo mi pedido?",
    answer:
      "Recibirás el número de tracking de Olva por email cuando tu pedido salga de nuestro almacén. Úsalo en la web de Olva Courier para seguir el estado.",
  },
  {
    category: "Envíos",
    question: "¿Qué pasa si no estoy en casa al momento de la entrega?",
    answer:
      "Olva realiza hasta 2 intentos de entrega. Si no es posible, coordinarán contigo una nueva fecha o podrás recogerlo en la agencia más cercana.",
  },

  {
    category: "Cambios y Devoluciones",
    question: "¿Puedo cambiar de talla o color?",
    answer:
      "Sí. Tienes 7 días desde la entrega para solicitar un cambio. La prenda debe estar sin usar, con etiquetas originales y en su empaque.",
  },
  {
    category: "Cambios y Devoluciones",
    question: "¿Cuánto tarda un reembolso?",
    answer:
      "5-7 días hábiles desde que recibimos la devolución en nuestro almacén. Recibirás una notificación por email cuando se procese.",
  },
  {
    category: "Cambios y Devoluciones",
    question: "¿Quién paga el envío de una devolución?",
    answer:
      "Si el producto tiene falla de fábrica, nosotros asumimos el costo. Si es por cambio de talla o color, el envío corre por cuenta del cliente.",
  },
  {
    category: "Cambios y Devoluciones",
    question: "¿Qué productos no tienen devolución?",
    answer:
      "Los productos en oferta final o artículos de uso personal no tienen devolución por motivos de higiene.",
  },

  {
    category: "Pagos",
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos Yape, Plin, transferencia bancaria y tarjetas de crédito o débito a través de pasarelas de pago seguras.",
  },
  {
    category: "Pagos",
    question: "¿Es seguro pagar en su web?",
    answer:
      "Totalmente. Usamos cifrado SSL y pasarelas de pago seguras. No almacenamos datos de tarjetas ni información bancaria.",
  },
  {
    category: "Pagos",
    question: "¿Puedo pagar contra entrega?",
    answer:
      "Por el momento solo aceptamos pago anticipado. Estamos trabajando para ofrecer la opción de pago contra entrega próximamente.",
  },
  {
    category: "Pagos",
    question: "¿Emite boleta o factura?",
    answer:
      "Sí. Emitimos boleta de venta electrónica para todos los pedidos. Si necesitas factura, indícalo en los comentarios de tu pedido.",
  },

  {
    category: "Productos",
    question: "¿Los productos son originales?",
    answer:
      "Sí. Todos nuestros productos son diseños originales DYDALO, fabricados con materiales de alta calidad y atención al detalle.",
  },
  {
    category: "Productos",
    question: "¿Cómo sé si un producto está disponible?",
    answer:
      "Los productos sin stock muestran la etiqueta Agotado. Te recomendamos seguirnos en redes o suscribirte al newsletter para enterarte de nuevos drops.",
  },
  {
    category: "Productos",
    question: "¿Cada cuánto lanzan nuevos productos?",
    answer:
      "Lanzamos colecciones en drops limitados durante el año. Síguenos en Instagram para enterarte antes que nadie.",
  },
  {
    category: "Productos",
    question: "¿Los colores en la foto son exactos?",
    answer:
      "Hacemos nuestro mejor esfuerzo para mostrar los colores con precisión, pero pueden variar ligeramente según la pantalla de tu dispositivo.",
  },

  {
    category: "Mi Cuenta",
    question: "¿Necesito crear una cuenta para comprar?",
    answer:
      "Sí. Necesitas una cuenta para realizar pedidos y dar seguimiento a tus compras. El registro es gratis y toma menos de un minuto.",
  },
  {
    category: "Mi Cuenta",
    question: "¿Olvidé mi contraseña?",
    answer:
      "Usa la opción Recuperar contraseña en la pantalla de inicio de sesión. Te enviaremos un enlace para restablecerla.",
  },
  {
    category: "Mi Cuenta",
    question: "¿Cómo actualizo mis datos personales?",
    answer:
      "Ve a Mi Cuenta en el menú superior. Allí puedes editar tu nombre, email, dirección de envío y teléfono.",
  },
  {
    category: "Mi Cuenta",
    question: "¿Puedo ver mi historial de pedidos?",
    answer:
      "Sí. En Mi Cuenta → Pedidos encuentras todos tus pedidos con su estado actual (pendiente, confirmado, enviado, entregado).",
  },

  {
    category: "Tallas",
    question: "¿Cómo elijo mi talla?",
    answer:
      "Tenemos una guía de tallas detallada en nuestra web con medidas en centímetros para cada tipo de prenda. Revísala antes de comprar.",
  },
  {
    category: "Tallas",
    question: "¿Qué hago si no estoy seguro de mi talla?",
    answer:
      "Escríbenos por el formulario de contacto con tus medidas (pecho, cintura, cadera) y te asesoramos para elegir la talla correcta.",
  },
  {
    category: "Tallas",
    question: "¿Todas las prendas usan la misma tabla de tallas?",
    answer:
      "No. La tabla de tallas varía entre ropa y calzado. Consulta la guía específica para cada tipo de producto antes de comprar.",
  },
];

const categories = [
  "Todos",
  "Pedidos",
  "Envíos",
  "Cambios y Devoluciones",
  "Pagos",
  "Productos",
  "Mi Cuenta",
  "Tallas",
];

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
            className="uppercase tracking-dropdown"
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
                    <p className="body-sm">
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
