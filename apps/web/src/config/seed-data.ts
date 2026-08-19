import { productsStore } from "@/lib/stores/data-store.products";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { blogStore } from "@/lib/stores/data-store.blog";
import { getVariantId } from "@/lib/utils/inventory";
import type { User, BlogPost, Address, CreateOrderInput } from "@/lib/stores/data-store.types";

let seeded = false;

export function seedIfEmpty(): void {
  if (seeded) return;
  const products = productsStore.getAll();
  if (products.length === 0) return;
  seeded = true;

  const users = usersStore.getAll();
  if (users.length > 0) return;

  const sampleUsers: Omit<User, "id" | "createdAt" | "updatedAt">[] = [
    { name: "Carlos Mendoza", firstName: "Carlos", lastName: "Mendoza", email: "carlos@email.com", role: "customer", phone: "+51 987 654 321", passwordHash: "", emailVerified: true, lastLoginAt: "" },
    { name: "Ana Rivera", firstName: "Ana", lastName: "Rivera", email: "ana@email.com", role: "customer", phone: "+51 912 345 678", passwordHash: "", emailVerified: true, lastLoginAt: "" },
    { name: "Luis Torres", firstName: "Luis", lastName: "Torres", email: "luis@email.com", role: "customer", passwordHash: "", emailVerified: true, lastLoginAt: "" },
    { name: "Sofia Vega", firstName: "Sofia", lastName: "Vega", email: "sofia@email.com", role: "customer", passwordHash: "", emailVerified: true, lastLoginAt: "" },
    { name: "Diego Paz", firstName: "Diego", lastName: "Paz", email: "diego@email.com", role: "customer", passwordHash: "", emailVerified: true, lastLoginAt: "" },
    { name: "Usuario DYDALO", firstName: "Usuario", lastName: "DYDALO", email: "usuario@dydalo.com", role: "customer", phone: "+51 999 999 999", passwordHash: "", emailVerified: true, lastLoginAt: "" },
  ];

  const createdUsers = sampleUsers.map((u) => usersStore.create(u));

  const orderInputs: CreateOrderInput[] = [
    {
      userId: createdUsers[0].id,
      items: [
        { productId: "1", variantId: getVariantId("M", "Negro"), name: "Heavy Cotton Polo", quantity: 2, price: 89, size: "M", color: "Negro" },
        { productId: "31", variantId: getVariantId("L", "Gris"), name: "Shadow Oversized Hoodie", quantity: 1, price: 128, size: "L", color: "Gris" },
      ],
      subtotal: 306,
      shipping: 15,
      discount: 0,
      total: 321,
    },
    {
      userId: createdUsers[1].id,
      items: [
        { productId: "51", variantId: getVariantId("32", "Indigo"), name: "Raw Denim Straight", quantity: 1, price: 145, size: "32", color: "Indigo" },
      ],
      subtotal: 145,
      shipping: 15,
      discount: 0,
      total: 160,
    },
    {
      userId: createdUsers[2].id,
      items: [
        { productId: "11", variantId: getVariantId("XL", "Negro"), name: "Midnight Track Set", quantity: 1, price: 189, size: "XL", color: "Negro" },
        { productId: "91", variantId: getVariantId("Única", "Negro/Blanco"), name: "Two Tone Caps", quantity: 2, price: 54, size: "Única", color: "Negro/Blanco" },
      ],
      subtotal: 297,
      shipping: 0,
      discount: 30,
      total: 267,
    },
    {
      userId: createdUsers[3].id,
      items: [
        { productId: "71", variantId: getVariantId("S", "Blanco"), name: "Ribbed Tank Top", quantity: 3, price: 64, size: "S", color: "Blanco" },
      ],
      subtotal: 192,
      shipping: 15,
      discount: 0,
      total: 207,
    },
    {
      userId: createdUsers[4].id,
      items: [
        { productId: "21", variantId: getVariantId("L", "Negro"), name: "Night Court High", quantity: 1, price: 176, size: "L", color: "Negro" },
        { productId: "41", variantId: getVariantId("M", "Arena"), name: "Cargo Drop Pants", quantity: 1, price: 132, size: "M", color: "Arena" },
        { productId: "92", variantId: getVariantId("Unica", "Plata"), name: "Cold Cuban Ice", quantity: 1, price: 249, size: "Unica", color: "Plata" },
      ],
      subtotal: 557,
      shipping: 0,
      discount: 50,
      total: 507,
    },
  ];

  const createdOrders = orderInputs.map((input) =>
    ordersStore.create({ ...input, shippingAddressSnapshot: { id: "", userId: input.userId, label: "", fullName: "", street: "", district: "", city: "", state: "", zip: "", country: "Perú", phone: "", isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } })
  );

  const now = new Date().toISOString();
  const addressSnapshots: Address[] = [
    { id: "addr-seed-1", userId: createdUsers[0].id, label: "Principal", fullName: "Carlos Mendoza", street: "Av. Larco 123", district: "", city: "Lima", state: "Lima", zip: "15074", country: "Perú", phone: "+51 987 654 321", isDefault: true, createdAt: now, updatedAt: now },
    { id: "addr-seed-2", userId: createdUsers[1].id, label: "Principal", fullName: "Ana Rivera", street: "Jr. Puno 456", district: "", city: "Arequipa", state: "Arequipa", zip: "04001", country: "Perú", phone: "+51 912 345 678", isDefault: true, createdAt: now, updatedAt: now },
    { id: "addr-seed-3", userId: createdUsers[2].id, label: "Principal", fullName: "Luis Torres", street: "Calle Real 789", district: "", city: "Cusco", state: "Cusco", zip: "08000", country: "Perú", phone: "", isDefault: true, createdAt: now, updatedAt: now },
    { id: "addr-seed-4", userId: createdUsers[3].id, label: "Principal", fullName: "Sofia Vega", street: "Av. Grau 234", district: "", city: "Trujillo", state: "La Libertad", zip: "13001", country: "Perú", phone: "+51 998 765 432", isDefault: true, createdAt: now, updatedAt: now },
    { id: "addr-seed-5", userId: createdUsers[4].id, label: "Principal", fullName: "Diego Paz", street: "Av. Arequipa 3456", district: "", city: "Lima", state: "Lima", zip: "15046", country: "Perú", phone: "+51 999 888 777", isDefault: true, createdAt: now, updatedAt: now },
  ];

  createdOrders.forEach((order, index) => {
    ordersStore.update(order.id, { shippingAddressSnapshot: addressSnapshots[index] });
  });

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
      coverImage: "/images/dydalo-panoramica.png",
      authorId: "system",
      authorName: "DYDALO",
      published: true,
    },
    {
      title: "Guía de Estilo: Streetwear para el verano",
      slug: "guia-estilo-streetwear-verano",
      excerpt: "Tips y combinaciones para dominar el streetwear en días de calor.",
      content: "Contenido del post...",
      coverImage: "/images/dydalo-tracksuit.jpg",
      authorId: "system",
      authorName: "DYDALO",
      published: true,
    },
    {
      title: "Detrás del Diseño: Sneakers DYDALO",
      slug: "detras-diseno-sneakers-dydalo",
      excerpt: "El proceso creativo detrás de nuestro calzado más icónico.",
      content: "Contenido del post...",
      coverImage: "/images/dydalo-sneakers.jpg",
      authorId: "system",
      authorName: "DYDALO",
      published: true,
    },
  ];

  blogPosts.forEach((p) => blogStore.create(p));
}
