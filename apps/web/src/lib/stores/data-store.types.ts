export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  phone?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductSize = "S" | "M" | "L" | "XL" | "28" | "30" | "32" | "34" | "36" | "Única";

export type ProductVariantStock = {
  id: string;
  size: ProductSize;
  color: string;
  stock: number;
  active: boolean;
  lowStockThreshold?: number;
  updatedAt: string;
};

export type SizeGuideRow = {
  size: string;
  values: string[];
};

export type SizeGuideData = {
  columns: string[];
  unit: string;
  rows: SizeGuideRow[];
};

export type StockMovementType =
  | "purchase"
  | "sale"
  | "manual_adjustment"
  | "return"
  | "cancellation"
  | "order_edit"
  | "variant_created"
  | "variant_deactivated";

export type StockMovement = {
  id: string;
  productId: number;
  productName: string;
  productImage?: string;
  sku: string;
  variantId: string;
  size: string;
  color: string;
  type: StockMovementType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  orderId?: string;
  reason?: string;
  note?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type AuditEntityType =
  | "product"
  | "product_variant"
  | "order"
  | "category"
  | "user"
  | "blog"
  | "discount"
  | "inventory";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "stock_change"
  | "discount_change"
  | "activate"
  | "deactivate"
  | "export"
  | "import";

export type AuditChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type AuditLog = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  action: AuditAction;
  summary: string;
  before?: unknown;
  after?: unknown;
  changes?: AuditChange[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  image: string;
  images?: string[];
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
  stock: number;
  variants?: ProductVariantStock[];
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
  district?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export type Address = {
  id: string;
  userId: string;
  label: string;
  street: string;
  district: string;
  city: string;
  state: string;
  zip?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  userId: string;
  shippingAddressId?: string;
  source?: "checkout" | "admin";
  createdBy?: string;
  stockReserved?: boolean;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
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
  active: boolean;
  order: number;
  sizeGuide?: SizeGuideData;
};

export type CreateOrderInput = {
  userId: string;
  shippingAddressId?: string;
  source?: "checkout" | "admin";
  createdBy?: string;
  stockReserved?: boolean;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
};

export const STATUS_STYLES: Record<string, string> = {
  pendiente: "border bg-warning/10 text-warning border-warning/30",
  confirmado: "border bg-info/10 text-info border-info/30",
  enviado: "border bg-purple/10 text-purple border-purple/30",
  entregado: "border bg-success/10 text-success border-success/30",
  cancelado: "border bg-danger/10 text-danger border-danger/30",
  devuelto: "border bg-orange/10 text-orange border-orange/30",
};
