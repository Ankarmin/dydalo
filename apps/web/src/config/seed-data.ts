import { productsStore } from "@/lib/stores/data-store.products";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { blogStore } from "@/lib/stores/data-store.blog";
import type { User, BlogPost, CreateOrderInput } from "@/lib/stores/data-store.types";

let seeded = false;

export function seedIfEmpty(): void {
  if (seeded) return;
  const products = productsStore.getAll();
  if (products.length === 0) return;
  seeded = true;

  const users = usersStore.getAll();
  if (users.length > 0) return;

  const sampleUsers: Omit<User, "id" | "createdAt" | "updatedAt">[] = [
    { name: "Carlos Mendoza", email: "carlos@email.com", role: "customer", phone: "+51 987 654 321" },
    { name: "Ana Rivera", email: "ana@email.com", role: "customer", phone: "+51 912 345 678" },
    { name: "Luis Torres", email: "luis@email.com", role: "customer" },
    { name: "Sofia Vega", email: "sofia@email.com", role: "customer" },
    { name: "Diego Paz", email: "diego@email.com", role: "customer" },
  ];

  const createdUsers = sampleUsers.map((u) => usersStore.create(u));

  const orderInputs: CreateOrderInput[] = [
    {
      userId: createdUsers[0].id,
      items: [
        { productId: 1, name: "Heavy Cotton Polo", quantity: 2, price: 89, size: "M", color: "Negro" },
        { productId: 31, name: "Shadow Oversized Hoodie", quantity: 1, price: 128, size: "L", color: "Gris" },
      ],
      subtotal: 306,
      shipping: 15,
      discount: 0,
      total: 321,
      shippingAddress: { fullName: "Carlos Mendoza", street: "Av. Larco 123", city: "Lima", state: "Lima", zip: "15074", country: "Perú", phone: "+51 987 654 321" },
    },
    {
      userId: createdUsers[1].id,
      items: [
        { productId: 51, name: "Raw Denim Straight", quantity: 1, price: 145, size: "32", color: "Indigo" },
      ],
      subtotal: 145,
      shipping: 15,
      discount: 0,
      total: 160,
      shippingAddress: { fullName: "Ana Rivera", street: "Jr. Puno 456", city: "Arequipa", state: "Arequipa", zip: "04001", country: "Perú", phone: "+51 912 345 678" },
    },
    {
      userId: createdUsers[2].id,
      items: [
        { productId: 11, name: "Midnight Track Set", quantity: 1, price: 189, size: "XL", color: "Negro" },
        { productId: 91, name: "Two Tone Caps", quantity: 2, price: 54, size: "Única", color: "Negro/Blanco" },
      ],
      subtotal: 297,
      shipping: 0,
      discount: 30,
      total: 267,
      shippingAddress: { fullName: "Luis Torres", street: "Calle Real 789", city: "Cusco", state: "Cusco", zip: "08000", country: "Perú", phone: "" },
    },
    {
      userId: createdUsers[3].id,
      items: [
        { productId: 71, name: "Ribbed Tank Top", quantity: 3, price: 64, size: "S", color: "Blanco" },
      ],
      subtotal: 192,
      shipping: 15,
      discount: 0,
      total: 207,
      shippingAddress: { fullName: "Sofia Vega", street: "Av. Grau 234", city: "Trujillo", state: "La Libertad", zip: "13001", country: "Perú", phone: "+51 998 765 432" },
    },
    {
      userId: createdUsers[4].id,
      items: [
        { productId: 21, name: "Night Court High", quantity: 1, price: 176, size: "L", color: "Negro" },
        { productId: 41, name: "Cargo Drop Pants", quantity: 1, price: 132, size: "M", color: "Arena" },
        { productId: 92, name: "Cold Cuban Ice", quantity: 1, price: 249, size: "Única", color: "Plata" },
      ],
      subtotal: 557,
      shipping: 0,
      discount: 50,
      total: 507,
      shippingAddress: { fullName: "Diego Paz", street: "Av. Arequipa 3456", city: "Lima", state: "Lima", zip: "15046", country: "Perú", phone: "+51 999 888 777" },
    },
  ];

  const createdOrders = orderInputs.map((input) => ordersStore.create(input));

  ordersStore.transitionStatus(createdOrders[0].id, "confirmado", createdUsers[0].id);
  ordersStore.transitionStatus(createdOrders[0].id, "enviado", createdUsers[0].id);
  ordersStore.transitionStatus(createdOrders[1].id, "confirmado", createdUsers[1].id);
  ordersStore.transitionStatus(createdOrders[2].id, "confirmado", createdUsers[2].id);
  ordersStore.transitionStatus(createdOrders[2].id, "cancelado", createdUsers[2].id);
  ordersStore.transitionStatus(createdOrders[3].id, "confirmado", createdUsers[3].id);
  ordersStore.transitionStatus(createdOrders[3].id, "enviado", createdUsers[3].id);
  ordersStore.transitionStatus(createdOrders[3].id, "entregado", createdUsers[3].id);

  const blogPosts: Omit<BlogPost, "id" | "createdAt" | "updatedAt">[] = [
    {
      title: "The Real Cream — Nueva Colección",
      slug: "the-real-cream-nueva-coleccion",
      excerpt: "Descubre la nueva colección de DYDALO con los esenciales de la temporada.",
      content: "Contenido del post...",
      coverImage: "/images/dydalo-hero-negro.webp",
      author: "DYDALO",
      tags: ["coleccion", "lanzamiento"],
      published: true,
    },
    {
      title: "Guía de Estilo: Streetwear para el verano",
      slug: "guia-estilo-streetwear-verano",
      excerpt: "Tips y combinaciones para dominar el streetwear en días de calor.",
      content: "Contenido del post...",
      coverImage: "/images/dydalo-tracksuit.jpg",
      author: "DYDALO",
      tags: ["estilo", "streetwear", "verano"],
      published: true,
    },
    {
      title: "Detrás del Diseño: Sneakers DYDALO",
      slug: "detras-diseno-sneakers-dydalo",
      excerpt: "El proceso creativo detrás de nuestro calzado más icónico.",
      content: "Contenido del post...",
      coverImage: "/images/dydalo-sneakers.jpg",
      author: "DYDALO",
      tags: ["diseno", "sneakers", "detras-de-camaras"],
      published: true,
    },
  ];

  blogPosts.forEach((p) => blogStore.create(p));
}
