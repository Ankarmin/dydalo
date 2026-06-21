export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductType = "Ropa" | "Calzado" | "Accesorios" | "Bling";

export type ProductSize = "S" | "M" | "L" | "XL" | "28" | "30" | "32" | "34" | "36" | "Única";

export type AdminProduct = {
  id: number;
  name: string;
  type: ProductType;
  category: string;
  price: number;
  image: string;
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
  stock: number;
  active: boolean;
  featured: boolean;
  discount: number | null;
  sku: string;
  createdAt: string;
  updatedAt: string;
};

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "enviado",
  "entregado",
  "cancelado",
  "devuelto",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type StatusTransition = {
  from: OrderStatus;
  to: OrderStatus;
  at: string;
  by: string;
};

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
};

export type ShippingAddress = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  notes: string | null;
  statusHistory: StatusTransition[];
  createdAt: string;
  updatedAt: string;
};

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: ["devuelto"],
  cancelado: [],
  devuelto: [],
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LookbookEntry = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  productIds: number[];
  order: number;
  published: boolean;
  createdAt: string;
};

export type SiteConfig = {
  siteName: string;
  siteDescription: string;
  brandSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: Partial<Record<"instagram" | "tiktok" | "youtube" | "twitter" | "facebook", string>>;
  shippingInfo: string;
  returnPolicy: string;
  sizeGuide: string;
  faq: Array<{ question: string; answer: string }>;
  heroSettings: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  maintenanceMode: boolean;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  order: number;
};

export type CreateOrderInput = {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  trackingNumber?: string | null;
  notes?: string | null;
};
