import { read, write, generateId, KEYS } from "./data-store.utils";
import type { SiteConfig } from "./data-store.types";

const DEFAULT_CONFIG: SiteConfig = {
  id: "default",
  siteName: "DYDALO",
  siteDescription: "Streetwear premium y exclusivo para un flow sin límites.",
  brandSubtitle: "The Real Cream",
  contactEmail: "contacto@dydalo.com",
  contactPhone: "",
  address: "",
  socialLinks: {},
  shippingInfo: "## Envíos\n\n**Lima Metropolitana:** Envío gratis en todos los pedidos. Entrega en 2-3 días hábiles.\n\n**Provincia:** Envíos vía Olva desde S/ 15. Entrega en 5-12 días hábiles. El costo varía según peso y destino.",
  returnPolicy: "## Devoluciones\n\nPolítica de devoluciones próximamente.",
  sizeGuide: "## Guía de Tallas\n\nGuía de tallas próximamente.",
  faq: [
    { id: "1", question: "¿Cómo realizo un pedido?", answer: "Explora nuestro catálogo, selecciona la talla y color que prefieras, agrega al carrito y finaliza la compra completando tus datos de envío." },
    { id: "2", question: "¿Puedo modificar mi pedido después de pagar?", answer: "Tienes 1 hora tras el pago para solicitar cambios. Escríbenos por el formulario de contacto incluyendo tu número de pedido y lo gestionamos." },
    { id: "3", question: "¿Cómo sé si mi pedido fue confirmado?", answer: "Recibirás un email de confirmación con el resumen de tu compra en cuanto el pago sea procesado exitosamente." },
    { id: "4", question: "¿Puedo cancelar un pedido?", answer: "Sí, siempre que aún no haya sido enviado. Escríbenos por contacto indicando tu número de pedido y lo cancelamos sin costo." },
    { id: "5", question: "¿Hay un pedido mínimo?", answer: "No. Puedes comprar desde un solo producto sin monto mínimo." },
    { id: "6", question: "¿Cuánto tarda el envío?", answer: "Lima Metropolitana: 2-3 días hábiles con envío gratis. Provincia vía Olva: 5-12 días hábiles con costo desde S/ 15." },
    { id: "7", question: "¿El envío es gratis en todos los pedidos?", answer: "El envío es gratis solo en Lima Metropolitana. Para provincia, el costo varía según peso y destino y lo asume el cliente." },
    { id: "8", question: "¿Hacen envíos a todo el Perú?", answer: "Sí. Realizamos envíos a todo el territorio nacional: gratis en Lima y vía Olva para provincia." },
    { id: "9", question: "¿Cómo sé el estado de mi pedido?", answer: "Te notificaremos por email cada vez que tu pedido cambie de estado (confirmado, enviado, entregado). También puedes contactarnos por WhatsApp para consultar." },
    { id: "10", question: "¿Qué pasa si no estoy en casa al momento de la entrega?", answer: "Olva realiza hasta 2 intentos de entrega. Si no es posible, coordinarán contigo una nueva fecha o podrás recogerlo en la agencia más cercana." },
    { id: "11", question: "¿Puedo cambiar de talla o color?", answer: "Sí. Tienes 7 días desde la entrega para solicitar un cambio. La prenda debe estar sin usar, con etiquetas originales y en su empaque." },
    { id: "12", question: "¿Cuánto tarda un reembolso?", answer: "5-7 días hábiles desde que recibimos la devolución en nuestro almacén. Recibirás una notificación por email cuando se procese." },
    { id: "13", question: "¿Quién paga el envío de una devolución?", answer: "Si el producto tiene falla de fábrica, nosotros asumimos el costo. Si es por cambio de talla o color, el envío corre por cuenta del cliente." },
    { id: "14", question: "¿Qué productos no tienen devolución?", answer: "Los productos en oferta final o artículos de uso personal no tienen devolución por motivos de higiene." },
    { id: "15", question: "¿Qué métodos de pago aceptan?", answer: "Aceptamos Yape, Plin, transferencia bancaria y tarjetas de crédito o débito a través de pasarelas de pago seguras." },
    { id: "16", question: "¿Es seguro pagar en su web?", answer: "Totalmente. Usamos cifrado SSL y pasarelas de pago seguras. No almacenamos datos de tarjetas ni información bancaria." },
    { id: "17", question: "¿Puedo pagar contra entrega?", answer: "Por el momento solo aceptamos pago anticipado. Estamos trabajando para ofrecer la opción de pago contra entrega próximamente." },
    { id: "18", question: "¿Emite boleta o factura?", answer: "Sí. Emitimos boleta de venta electrónica para todos los pedidos. Si necesitas factura, indícalo en los comentarios de tu pedido." },
    { id: "19", question: "¿Los productos son originales?", answer: "Sí. Todos nuestros productos son diseños originales DYDALO, fabricados con materiales de alta calidad y atención al detalle." },
    { id: "20", question: "¿Cómo sé si un producto está disponible?", answer: "Los productos sin stock muestran la etiqueta Agotado. Te recomendamos seguirnos en redes o suscribirte al newsletter para enterarte de nuevos drops." },
    { id: "21", question: "¿Cada cuánto lanzan nuevos productos?", answer: "Lanzamos colecciones en drops limitados durante el año. Síguenos en Instagram para enterarte antes que nadie." },
    { id: "22", question: "¿Los colores en la foto son exactos?", answer: "Hacemos nuestro mejor esfuerzo para mostrar los colores con precisión, pero pueden variar ligeramente según la pantalla de tu dispositivo." },
    { id: "23", question: "¿Necesito crear una cuenta para comprar?", answer: "Sí. Necesitas una cuenta para realizar pedidos y dar seguimiento a tus compras. El registro es gratis y toma menos de un minuto." },
    { id: "24", question: "¿Olvidé mi contraseña?", answer: "Usa la opción Recuperar contraseña en la pantalla de inicio de sesión. Te enviaremos un enlace para restablecerla." },
    { id: "25", question: "¿Cómo actualizo mis datos personales?", answer: "Ve a Mi Cuenta en el menú superior. Allí puedes editar tu nombre, email, dirección de envío y teléfono." },
    { id: "26", question: "¿Puedo ver mi historial de pedidos?", answer: "Sí. En Mi Cuenta → Pedidos encuentras todos tus pedidos con su estado actual (pendiente, confirmado, enviado, entregado)." },
    { id: "27", question: "¿Cómo elijo mi talla?", answer: "Tenemos una guía de tallas detallada en nuestra web con medidas en centímetros para cada tipo de prenda. Revísala antes de comprar." },
    { id: "28", question: "¿Qué hago si no estoy seguro de mi talla?", answer: "Escríbenos por el formulario de contacto con tus medidas (pecho, cintura, cadera) y te asesoramos para elegir la talla correcta." },
    { id: "29", question: "¿Todas las prendas usan la misma tabla de tallas?", answer: "No. La tabla de tallas varía entre ropa y calzado. Consulta la guía específica para cada tipo de producto antes de comprar." },
  ],
  heroSettings: {
    title: "THE REAL CREAM",
    subtitle: "Descubre la nueva colección",
    ctaText: "VER CATÁLOGO",
    ctaLink: "/catalogo",
    backgroundImage: "/images/dydalo-hero-negro.webp",
  },
  maintenanceMode: false,
};

function get(): SiteConfig {
  const stored = read<SiteConfig>(KEYS.config, DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG, ...stored, id: stored.id || DEFAULT_CONFIG.id };
}

function update(data: Partial<SiteConfig>): SiteConfig {
  const current = get();
  const updated: SiteConfig = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.config, updated);
  return updated;
}

function reset(): SiteConfig {
  write(KEYS.config, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export const configStore = { get, update, reset };
