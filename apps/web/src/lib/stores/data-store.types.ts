export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  phone?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductSize = "S" | "M" | "L" | "XL" | "28" | "30" | "32" | "34" | "36" | "Unica";

export type ProductVariantStock = {
  id: string;
  size: ProductSize;
  color: string;
  stock: number;
  active: boolean;
  lowStockThreshold?: number;
  sku?: string;
  createdAt?: string;
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
  | "reservation"
  | "release_reservation"
  | "manual_adjustment"
  | "return"
  | "damage"
  | "cancellation"
  | "order_edit"
  | "variant_created"
  | "variant_deactivated";

export type StockMovement = {
  id: string;
  productId: string;
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
  id: string;
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
  description?: string;
  costPrice?: number;
  metaTitle?: string;
  metaDescription?: string;
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
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  price: number;
  unitCost?: number;
  size: string;
  color: string;
};

export type CouponType = "PERCENT" | "AMOUNT";

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  usedCount: number;
  usedBy: string[];
  usedEmails: string[];
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {  id: string;
  name: string;
  contact?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseStatus = "pendiente" | "parcial" | "recibida" | "cancelada";

export type PurchaseLine = {
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseStatus;
  lines: PurchaseLine[];
  note?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type Address = {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  street: string;
  district: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderOrigin = "mp_online" | "manual";

export type PaymentStatus =
  | "sin_registro"
  | "pendiente"
  | "in_process"
  | "aprobado"
  | "rechazado"
  | "cancelado"
  | "reembolsado"
  | "en_revision"
  | "verificado_manual"
  | "en_disputa"
  | "contracargo";

export type PaymentActor = "sistema_mp" | "cliente" | "diego" | "david" | "admin" | "sistema";

export type PaymentAttempt = {
  id: string;
  orderId: string;
  attemptNumber: number;
  status: PaymentStatus;
  amount: number;
  method?: string;
  mpPaymentId?: string;
  mpStatusDetail?: string;
  reason?: string;
  evidence?: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  updatedAt: string;
};

export type FulfillmentType = "LIMA_APP" | "PROVINCIA_OLVA" | "RECOJO";

export type ShipmentStatus =
  | "pendiente"
  | "conductor_asignado"
  | "en_camino"
  | "en_agencia"
  | "en_transito"
  | "coordinado"
  | "listo_para_recojo"
  | "entregado"
  | "fallido"
  | "cancelado"
  | "no_show"
  | "devuelto_agencia";

export type ShipmentEvent = {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  courier?: string;
  trackingCode?: string;
  note?: string;
  evidence?: string;
  actorId: string;
  actorName: string;
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  shippingAddressId?: string;
  source?: "checkout" | "admin";
  origin?: OrderOrigin;
  manualWithMpLink?: boolean;
  createdBy?: string;
  stockReserved?: boolean;
  reservationExpiryAt?: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  total: number;
  shippingAddressSnapshot: Address;
  statusHistory: StatusTransition[];
  paymentMethod?: string;
  paymentStatus?: PaymentStatus | string;  paymentAttempts?: PaymentAttempt[];
  mpPaymentId?: string;
  fulfillmentType?: FulfillmentType;
  shipmentStatus?: ShipmentStatus;
  courier?: string;
  trackingCode?: string;
  realShippingCost?: number;
  pickupName?: string;
  pickupDni?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
};

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
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
  authorId: string;
  authorName: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SiteConfig = {
  id: string;
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
  faq: Array<{ id: string; category: string; question: string; answer: string }>;
  heroSettings: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  maintenanceMode: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  order: number;
  description?: string;
  image?: string;
  parentId?: string;
  sizeGuide?: SizeGuideData;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  userId: string;
  shippingAddressId?: string;
  source?: "checkout" | "admin";
  origin?: OrderOrigin;
  manualWithMpLink?: boolean;
  createdBy?: string;
  stockReserved?: boolean;
  reservationExpiryAt?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus | string;
  mpPaymentId?: string;
  fulfillmentType?: FulfillmentType;
  shipmentStatus?: ShipmentStatus;
  courier?: string;
  trackingCode?: string;
  realShippingCost?: number;
  pickupName?: string;
  pickupDni?: string;
  trackingNumber?: string;
};

export const STATUS_STYLES: Record<string, string> = {
  pendiente: "border bg-warning/10 text-warning border-warning/30",
  confirmado: "border bg-info/10 text-info border-info/30",
  enviado: "border bg-purple/10 text-purple border-purple/30",
  entregado: "border bg-success/10 text-success border-success/30",
  cancelado: "border bg-danger/10 text-danger border-danger/30",
  devuelto: "border bg-orange/10 text-orange border-orange/30",
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "sin_registro",
  "pendiente",
  "in_process",
  "aprobado",
  "rechazado",
  "cancelado",
  "reembolsado",
  "en_revision",
  "verificado_manual",
  "en_disputa",
  "contracargo",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  sin_registro: "Sin registro",
  pendiente: "Pendiente",
  in_process: "En proceso MP",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  en_revision: "En revisión",
  verificado_manual: "Verificado manual",
  en_disputa: "En disputa",
  contracargo: "Contracargo",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  sin_registro: "border bg-muted/10 text-muted-foreground border-border",
  pendiente: "border bg-warning/10 text-warning border-warning/30",
  in_process: "border bg-info/10 text-info border-info/30",
  aprobado: "border bg-success/10 text-success border-success/30",
  rechazado: "border bg-danger/10 text-danger border-danger/30",
  cancelado: "border bg-danger/10 text-danger border-danger/30",
  reembolsado: "border bg-orange/10 text-orange border-orange/30",
  en_revision: "border bg-purple/10 text-purple border-purple/30",
  verificado_manual: "border bg-success/10 text-success border-success/30",
  en_disputa: "border bg-orange/10 text-orange border-orange/30",
  contracargo: "border bg-danger/10 text-danger border-danger/30",
};

export function getOrderOrigin(order: Pick<Order, "origin" | "source">): OrderOrigin {
  if (order.origin) return order.origin;
  return order.source === "admin" ? "manual" : "mp_online";
}

export function getOrderOriginLabel(origin: OrderOrigin): string {
  return origin === "manual" ? "Manual" : "Online MP";
}

export const RESERVATION_TTL_HOURS: Record<OrderOrigin, number> = {
  mp_online: 24,
  manual: 48,
};

export function getReservationExpiry(origin: OrderOrigin, from: Date = new Date()): string {
  const ttl = RESERVATION_TTL_HOURS[origin];
  return new Date(from.getTime() + ttl * 60 * 60 * 1000).toISOString();
}

export function isReservationExpired(expiryAt?: string, now: Date = new Date()): boolean {
  if (!expiryAt) return false;
  return new Date(expiryAt).getTime() <= now.getTime();
}

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  LIMA_APP: "Lima por aplicativo",
  PROVINCIA_OLVA: "Provincia Olva",
  RECOJO: "Recojo en oficina",
};

export const FULFILLMENT_SHORT_LABELS: Record<FulfillmentType, string> = {
  LIMA_APP: "App Lima",
  PROVINCIA_OLVA: "Olva",
  RECOJO: "Recojo",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pendiente: "Pendiente",
  conductor_asignado: "Conductor asignado",
  en_camino: "En camino",
  en_agencia: "En agencia",
  en_transito: "En tránsito",
  coordinado: "Coordinado",
  listo_para_recojo: "Listo para recojo",
  entregado: "Entregado",
  fallido: "Fallido",
  cancelado: "Cancelado",
  no_show: "No se presentó",
  devuelto_agencia: "Devuelto a agencia",
};

export const SHIPMENT_STATUS_STYLES: Record<ShipmentStatus, string> = {
  pendiente: "border bg-warning/10 text-warning border-warning/30",
  conductor_asignado: "border bg-info/10 text-info border-info/30",
  en_camino: "border bg-info/10 text-info border-info/30",
  en_agencia: "border bg-purple/10 text-purple border-purple/30",
  en_transito: "border bg-purple/10 text-purple border-purple/30",
  coordinado: "border bg-info/10 text-info border-info/30",
  listo_para_recojo: "border bg-success/10 text-success border-success/30",
  entregado: "border bg-success/10 text-success border-success/30",
  fallido: "border bg-danger/10 text-danger border-danger/30",
  cancelado: "border bg-danger/10 text-danger border-danger/30",
  no_show: "border bg-orange/10 text-orange border-orange/30",
  devuelto_agencia: "border bg-orange/10 text-orange border-orange/30",
};

export const SHIPMENT_TRANSITIONS: Record<FulfillmentType, Record<ShipmentStatus, ShipmentStatus[]>> = {
  LIMA_APP: {
    pendiente: ["conductor_asignado", "cancelado"],
    conductor_asignado: ["en_camino", "cancelado"],
    en_camino: ["entregado", "cancelado"],
    entregado: [],
    en_agencia: [],
    en_transito: [],
    coordinado: [],
    listo_para_recojo: [],
    fallido: [],
    cancelado: [],
    no_show: [],
    devuelto_agencia: [],
  },
  PROVINCIA_OLVA: {
    pendiente: ["en_agencia", "cancelado"],
    en_agencia: ["en_transito", "cancelado"],
    en_transito: ["entregado", "fallido"],
    fallido: ["en_transito", "devuelto_agencia"],
    entregado: [],
    devuelto_agencia: [],
    conductor_asignado: [],
    en_camino: [],
    coordinado: [],
    listo_para_recojo: [],
    cancelado: [],
    no_show: [],
  },
  RECOJO: {
    pendiente: ["coordinado", "cancelado"],
    coordinado: ["listo_para_recojo", "cancelado"],
    listo_para_recojo: ["entregado", "no_show", "cancelado"],
    no_show: ["coordinado", "cancelado"],
    entregado: [],
    conductor_asignado: [],
    en_camino: [],
    en_agencia: [],
    en_transito: [],
    fallido: [],
    cancelado: [],
    devuelto_agencia: [],
  },
};

export function suggestFulfillment(city?: string, state?: string): FulfillmentType {
  const normalized = `${city ?? ""} ${state ?? ""}`.toLowerCase();
  if (normalized.includes("lima")) return "LIMA_APP";
  if (!city && !state) return "LIMA_APP";
  return "PROVINCIA_OLVA";
}

export const OLVA_BASE_PRICE = 15;

export function getFulfillmentEstimatedPrice(type: FulfillmentType): number {
  if (type === "PROVINCIA_OLVA") return OLVA_BASE_PRICE;
  return 0;
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  recibida: "Recibida",
  cancelada: "Cancelada",
};

export const PURCHASE_STATUS_STYLES: Record<PurchaseStatus, string> = {
  pendiente: "border bg-warning/10 text-warning border-warning/30",
  parcial: "border bg-info/10 text-info border-info/30",
  recibida: "border bg-success/10 text-success border-success/30",
  cancelada: "border bg-danger/10 text-danger border-danger/30",
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  solicitada: "Solicitada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  recibida: "Recibida",
  inspeccionada: "Inspeccionada",
  cerrada: "Cerrada",
};

export const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  solicitada: "border bg-warning/10 text-warning border-warning/30",
  aprobada: "border bg-info/10 text-info border-info/30",
  rechazada: "border bg-danger/10 text-danger border-danger/30",
  recibida: "border bg-purple/10 text-purple border-purple/30",
  inspeccionada: "border bg-info/10 text-info border-info/30",
  cerrada: "border bg-success/10 text-success border-success/30",
};

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  talla: "Talla",
  color: "Color",
  falla_fabrica: "Falla de fábrica",
  incompleto: "Pedido incompleto",
  arrepentimiento: "Arrepentimiento",
  otro: "Otro",
};

export const RETURN_SLA_DAYS = 7;

export function getItemMargin(item: Pick<OrderItem, "price" | "quantity" | "unitCost">): number | null {
  if (item.unitCost === undefined) return null;
  return (item.price - item.unitCost) * item.quantity;
}

export function getOrderMargin(order: Pick<Order, "items">): { margin: number; cost: number; known: boolean } {
  let margin = 0;
  let cost = 0;
  let known = true;
  for (const item of order.items) {
    if (item.unitCost === undefined) {
      known = false;
      continue;
    }
    margin += (item.price - item.unitCost) * item.quantity;
    cost += item.unitCost * item.quantity;
  }
  return { margin, cost, known };
}

export function computeCouponDiscount(
  coupon: Pick<Coupon, "type" | "value">,
  subtotal: number
): number {
  if (subtotal <= 0) return 0;
  if (coupon.type === "PERCENT") {
    return Math.min(subtotal, Math.round((subtotal * coupon.value) / 100 * 100) / 100);
  }
  return Math.min(subtotal, coupon.value);
}

export function describeCoupon(coupon: Pick<Coupon, "type" | "value">): string {
  return coupon.type === "PERCENT" ? `${coupon.value}%` : `S/${coupon.value}`;
}

export type ReturnOrigin = "web" | "admin";

export type ReturnStatus =
  | "solicitada"
  | "aprobada"
  | "rechazada"
  | "recibida"
  | "inspeccionada"
  | "cerrada";

export type ReturnReason =
  | "talla"
  | "color"
  | "falla_fabrica"
  | "incompleto"
  | "arrepentimiento"
  | "otro";

export type ReturnItem = {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  unitCost?: number;
  quantity: number;
  reason: ReturnReason;
  reasonNote?: string;
  receivedQuantity: number;
  restockQuantity: number;
  damageQuantity: number;
  evidence?: string;
};

export type ReturnRequest = {
  id: string;
  code: string;
  orderId: string;
  userId: string;
  origin: ReturnOrigin;
  status: ReturnStatus;
  items: ReturnItem[];
  refundAmount?: number;
  refundNote?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};
