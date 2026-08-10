import { read, write, generateId, KEYS } from "./data-store.utils";
import type {
  AdminProduct,
  AuditAction,
  AuditChange,
  AuditEntityType,
  AuditLog,
  BlogPost,
  Order,
  User,
} from "./data-store.types";

type Actor = {
  id: string;
  name: string;
};

type CreateAuditLogInput = Omit<AuditLog, "id" | "createdAt" | "createdBy" | "createdByName"> & {
  actor: Actor;
  createdAt?: string;
};

const SYSTEM_ACTOR: Actor = {
  id: "system",
  name: "Sistema",
};

function sortLogs(logs: AuditLog[]): AuditLog[] {
  return [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function getAll(): AuditLog[] {
  return read<AuditLog[]>(KEYS.auditLogs, []);
}

function create(data: CreateAuditLogInput): AuditLog {
  const log: AuditLog = {
    entityType: data.entityType,
    entityId: data.entityId,
    entityLabel: data.entityLabel,
    action: data.action,
    summary: data.summary,
    before: data.before,
    after: data.after,
    changes: data.changes,
    id: generateId(),
    createdBy: data.actor.id,
    createdByName: data.actor.name,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };

  write(KEYS.auditLogs, [log, ...getAll()]);
  return log;
}

function createMany(items: CreateAuditLogInput[]): AuditLog[] {
  if (items.length === 0) return [];

  const now = new Date().toISOString();
  const logs = items
    .map((item) => ({
      entityType: item.entityType,
      entityId: item.entityId,
      entityLabel: item.entityLabel,
      action: item.action,
      summary: item.summary,
      before: item.before,
      after: item.after,
      changes: item.changes,
      id: generateId(),
      createdBy: item.actor.id,
      createdByName: item.actor.name,
      createdAt: item.createdAt ?? now,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  write(KEYS.auditLogs, sortLogs([...logs, ...getAll()]));
  return logs;
}

function ensureInitialAuditSnapshot(): AuditLog[] {
  const existing = getAll();
  const hasLog = (entityType: AuditEntityType, entityId: string, action: AuditAction) =>
    existing.some((log) => log.entityType === entityType && log.entityId === entityId && log.action === action);
  const hasStatusChange = (orderId: string, before: string, after: string) =>
    existing.some((log) =>
      log.entityType === "order" &&
      log.entityId === orderId &&
      log.action === "status_change" &&
      log.changes?.some((change) => change.field === "status" && change.before === before && change.after === after)
    );

  const products = read<AdminProduct[]>(KEYS.products, []);
  const orders = read<Order[]>(KEYS.orders, []);
  const users = read<User[]>(KEYS.users, []);
  const posts = read<BlogPost[]>(KEYS.blog, []);
  const createdAt = new Date().toISOString();
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalVariants = products.reduce((sum, product) => sum + (product.variants?.length ?? 0), 0);
  const logs: CreateAuditLogInput[] = [];

  if (products.length > 0 && !hasLog("product", "initial-products", "import")) {
    logs.push({
      actor: SYSTEM_ACTOR,
      entityType: "product",
      entityId: "initial-products",
      entityLabel: "Catálogo inicial",
      action: "import",
      summary: `Importó ${products.length} productos iniciales al catálogo`,
      after: { products: products.length },
      changes: [{ field: "products", before: 0, after: products.length }],
      createdAt,
    });
  }

  if (products.length > 0 && !hasLog("inventory", "initial-inventory", "stock_change")) {
    logs.push({
      actor: SYSTEM_ACTOR,
      entityType: "inventory",
      entityId: "initial-inventory",
      entityLabel: "Inventario inicial",
      action: "stock_change",
      summary: `Registró stock inicial: ${totalStock} unidades en ${totalVariants} variantes`,
      after: { stock: totalStock, variants: totalVariants },
      changes: [
        { field: "stock", before: 0, after: totalStock },
        { field: "variants", before: 0, after: totalVariants },
      ],
      createdAt,
    });
  }

  for (const user of users.filter((user) => user.role === "customer")) {
    if (hasLog("user", user.id, "create")) continue;

    logs.push({
      actor: SYSTEM_ACTOR,
      entityType: "user",
      entityId: user.id,
      entityLabel: user.name,
      action: "create",
      summary: `Registró cliente ${user.name}`,
      after: { name: user.name, email: user.email, phone: user.phone ?? "" },
      createdAt: user.createdAt,
    });
  }

  for (const order of orders) {
    if (!hasLog("order", order.id, "create")) {
      logs.push({
        actor: SYSTEM_ACTOR,
        entityType: "order",
        entityId: order.id,
        entityLabel: `#${order.id.slice(0, 8)}`,
        action: "create",
        summary: `Registró pedido por S/ ${order.total.toFixed(2)}`,
        after: {
          status: order.status,
          total: order.total,
          items: order.items.length,
        },
        createdAt: order.createdAt,
      });
    }

    for (const transition of order.statusHistory.filter((transition) => transition.from !== transition.to)) {
      if (hasStatusChange(order.id, transition.from, transition.to)) continue;

      logs.push({
        actor: SYSTEM_ACTOR,
        entityType: "order",
        entityId: order.id,
        entityLabel: `#${order.id.slice(0, 8)}`,
        action: "status_change",
        summary: `Cambió el estado del pedido de ${transition.from} a ${transition.to}`,
        before: { status: transition.from },
        after: { status: transition.to },
        changes: [{ field: "status", before: transition.from, after: transition.to }],
        createdAt: transition.at,
      });
    }
  }

  for (const post of posts) {
    if (hasLog("blog", post.id, "create")) continue;

    logs.push({
      actor: SYSTEM_ACTOR,
      entityType: "blog",
      entityId: post.id,
      entityLabel: post.title,
      action: "create",
      summary: `Publicó entrada de blog ${post.title}`,
      after: { title: post.title, published: post.published },
      createdAt: post.createdAt,
    });
  }

  if (logs.length === 0) return sortLogs(existing);

  createMany(logs);
  return getAll();
}

function getByEntity(entityType: AuditEntityType, entityId: string): AuditLog[] {
  return getAll().filter((log) => log.entityType === entityType && log.entityId === entityId);
}

function getByAdmin(adminId: string): AuditLog[] {
  return getAll().filter((log) => log.createdBy === adminId);
}

function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: Array<keyof T>
): AuditChange[] {
  return fields
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({
      field: String(field),
      before: before[field],
      after: after[field],
    }));
}

function logAdminAction(input: {
  actor: Actor;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  action: AuditAction;
  summary: string;
  before?: unknown;
  after?: unknown;
  changes?: AuditChange[];
}): AuditLog {
  return create(input);
}

export const auditStore = {
  getAll,
  getByEntity,
  getByAdmin,
  create,
  createMany,
  ensureInitialAuditSnapshot,
  diffFields,
  logAdminAction,
};
