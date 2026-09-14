import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FulfillmentType,
  OrderOrigin,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import { ProductsRepository } from '../catalog/products/products.repository';
import { CouponsService } from '../coupons/coupons.service';
import type { Tx } from '../coupons/coupons.repository';
import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from '../users/users.repository';
import { AttemptsRepository } from './attempts.repository';
import { MovementsRepository } from './movements.repository';
import type { MovementInput } from './movements.repository';
import { OrdersRepository } from './orders.repository';
import type { OrderWithItems } from './orders.repository';
import { PaymentsService } from './payments.service';
import { reservationExpiry, shippingFor, unitFinalPrice } from './pricing';
import type { AdminCreateOrderDto, CreateOrderDto } from './dto/order.dto';

// Paridad con `VALID_TRANSITIONS` del frontend.
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
  devuelto: [],
};

const EXPIRABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  'sin_registro',
  'pendiente',
  'in_process',
  'rechazado',
  'en_revision',
];

export type ResolvedLine = {
  productId: string;
  variantId: string;
  productName: string;
  productImage: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  stockBefore: number;
};

export function orderLabel(id: string): string {
  return `#${id.slice(0, 8)}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly attempts: AttemptsRepository,
    private readonly movements: MovementsRepository,
    private readonly products: ProductsRepository,
    private readonly coupons: CouponsService,
    private readonly payments: PaymentsService,
    private readonly users: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  // Resuelve y tasa cada línea contra la DB (el cliente NO fija precios).
  private async resolveLines(
    tx: Tx,
    items: Array<{
      productId: string;
      size: string;
      color: string;
      quantity: number;
    }>,
  ): Promise<ResolvedLine[]> {
    if (items.length === 0) {
      throw new BadRequestException('El pedido necesita al menos un item');
    }
    const lines: ResolvedLine[] = [];
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }
      if (!product.active) {
        throw new ConflictException(`Producto no disponible: ${product.name}`);
      }
      const size = item.size.trim();
      const color = item.color.trim();
      const variant = product.variants.find(
        (v) =>
          v.size.toLowerCase() === size.toLowerCase() &&
          v.color.toLowerCase() === color.toLowerCase(),
      );
      if (!variant) {
        throw new NotFoundException(
          `Variante no encontrada: ${product.name} ${size}/${color}`,
        );
      }
      if (!variant.active) {
        throw new ConflictException(
          `Variante no disponible: ${product.name} ${size}/${color}`,
        );
      }
      lines.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        productImage: product.image,
        sku: product.sku,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unitPrice: unitFinalPrice(product.price, product.discount),
        unitCost: product.costPrice ?? undefined,
        stockBefore: variant.stock,
      });
    }
    return lines;
  }

  // Descuento con guardia anti-sobreventa: solo descuenta si hay stock.
  private async reserveStock(
    tx: Tx,
    lines: ResolvedLine[],
    orderId: string,
    actor: AuditActor,
    reason: string,
  ): Promise<void> {
    const movements: MovementInput[] = [];
    for (const line of lines) {
      const res = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count === 0) {
        throw new ConflictException(
          `Sin stock suficiente: ${line.productName} ${line.size}/${line.color} (quedan ${line.stockBefore})`,
        );
      }
      movements.push({
        productId: line.productId,
        productName: line.productName,
        productImage: line.productImage,
        sku: line.sku,
        variantId: line.variantId,
        size: line.size,
        color: line.color,
        type: 'reservation',
        quantityBefore: line.stockBefore,
        quantityChange: -line.quantity,
        quantityAfter: line.stockBefore - line.quantity,
        orderId,
        reason,
        createdBy: actor.id,
        createdByName: actor.name,
      });
    }
    await this.movements.createMany(movements, tx);
    for (const productId of new Set(lines.map((l) => l.productId))) {
      await this.products.recalcStock(productId, tx);
    }
  }

  // Devuelve stock reservado (cancelación, expiración, devolución).
  private async restoreStock(
    tx: Tx,
    order: OrderWithItems,
    type: 'cancellation' | 'return' | 'release_reservation',
    actor: AuditActor,
    reason: string,
  ): Promise<void> {
    const movements: MovementInput[] = [];
    for (const item of order.items) {
      if (!item.variantId) continue;
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) continue;
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { increment: item.quantity } },
      });
      movements.push({
        productId: item.productId,
        productName: product?.name ?? item.name,
        productImage: product?.image,
        sku: product?.sku ?? '',
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        type,
        quantityBefore: variant.stock,
        quantityChange: item.quantity,
        quantityAfter: variant.stock + item.quantity,
        orderId: order.id,
        reason,
        createdBy: actor.id,
        createdByName: actor.name,
      });
    }
    await this.movements.createMany(movements, tx);
    for (const productId of new Set(order.items.map((i) => i.productId))) {
      await this.products.recalcStock(productId, tx);
    }
  }

  private historyAppend(
    order: OrderWithItems,
    to: OrderStatus,
    by: string,
  ): Prisma.InputJsonValue {
    const history = (order.statusHistory ?? []) as Array<{
      from: OrderStatus;
      to: OrderStatus;
      at: string;
      by: string;
    }>;
    return [
      ...history,
      { from: order.status, to, at: new Date().toISOString(), by },
    ];
  }

  private async buildOrder(
    tx: Tx,
    input: {
      userId: string;
      userEmail: string;
      createdBy: string;
      actor: AuditActor;
      source: string;
      origin: OrderOrigin;
      dto: CreateOrderDto | AdminCreateOrderDto;
      initialPaymentStatus: PaymentStatus;
      paymentMethod?: string;
      courier?: string;
      trackingCode?: string;
      pickupName?: string;
      pickupDni?: string;
    },
  ): Promise<OrderWithItems> {
    const fulfillment: FulfillmentType =
      input.dto.fulfillmentType ?? 'LIMA_APP';
    const lines = await this.resolveLines(tx, input.dto.items);
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    let discount = 0;
    let couponId: string | undefined;
    let couponCode: string | undefined;
    if (input.dto.couponCode) {
      const check = await this.coupons.validateCoupon(
        input.dto.couponCode,
        { userId: input.userId, email: input.userEmail, subtotal },
        tx,
      );
      if (!check.valid) {
        throw new BadRequestException(check.error);
      }
      discount = check.discount;
      couponId = check.couponId;
      couponCode = check.code;
    }
    const shipping = shippingFor(fulfillment);
    const total = subtotal + shipping - discount;
    const snapshot = {
      id: input.dto.shippingAddressId ?? '',
      userId: input.userId,
      label: input.dto.shippingAddress.label,
      fullName: input.dto.shippingAddress.fullName,
      street: input.dto.shippingAddress.street,
      district: input.dto.shippingAddress.district,
      city: input.dto.shippingAddress.city,
      state: input.dto.shippingAddress.state,
      zip: input.dto.shippingAddress.zip ?? '',
      country: input.dto.shippingAddress.country ?? 'Perú',
      phone: input.dto.shippingAddress.phone,
      isDefault: false,
    };
    const now = new Date();
    const order = await this.orders.create(
      {
        user: { connect: { id: input.userId } },
        shippingAddressId: input.dto.shippingAddressId,
        source: input.source,
        origin: input.origin,
        createdBy: input.createdBy,
        stockReserved: true,
        reservationExpiryAt: reservationExpiry(input.origin, now),
        status: 'pendiente',
        subtotal,
        shipping,
        discount,
        couponCode,
        total,
        shippingAddressSnapshot: snapshot,
        statusHistory: [
          {
            from: 'pendiente',
            to: 'pendiente',
            at: now.toISOString(),
            by: input.createdBy,
          },
        ],
        paymentMethod: input.paymentMethod,
        paymentStatus: input.initialPaymentStatus,
        fulfillmentType: fulfillment,
        shipmentStatus: 'pendiente',
        courier: input.courier,
        trackingCode: input.trackingCode,
        pickupName: input.pickupName,
        pickupDni: input.pickupDni,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            name: l.productName,
            size: l.size,
            color: l.color,
            quantity: l.quantity,
            price: l.unitPrice,
            unitCost: l.unitCost,
          })),
        },
      },
      tx,
    );
    await this.reserveStock(
      tx,
      lines,
      order.id,
      input.actor,
      input.origin === 'manual'
        ? 'Reserva temporal pedido manual (expira en 48h sin pago)'
        : 'Reserva temporal checkout (expira en 24h sin pago)',
    );
    if (input.initialPaymentStatus !== 'sin_registro') {
      await this.payments.recordAttempt(
        tx,
        order,
        {
          status: input.initialPaymentStatus,
          amount: total,
          method: input.paymentMethod,
          reason:
            input.origin === 'manual'
              ? 'Pedido manual creado por admin'
              : 'Intento inicial checkout MP',
          actor: input.actor,
        },
        { updateOrderStatus: false },
      );
    }
    if (couponId) {
      await this.coupons.registerUse(tx, couponId, {
        userId: input.userId,
        email: input.userEmail,
        orderId: order.id,
      });
    }
    await this.audit.log(
      {
        entityType: 'order',
        entityId: order.id,
        entityLabel: orderLabel(order.id),
        action: 'create',
        summary: `Pedido ${orderLabel(order.id)} creado (${input.origin === 'manual' ? 'manual, reserva 48h' : 'online, reserva 24h'})`,
        after: { total, items: lines.length, couponCode },
        actor: input.actor,
      },
      tx,
    );
    const created = await this.orders.findById(order.id, tx);
    if (!created) throw new Error('Pedido recién creado no encontrado');
    return created;
  }

  // Checkout del cliente: siempre mp_online + intento pendiente.
  createCustomerOrder(
    user: { id: string; email: string; name: string },
    dto: CreateOrderDto,
  ): Promise<OrderWithItems> {
    const actor = { id: user.id, name: user.name };
    return this.prisma.$transaction((tx) =>
      this.buildOrder(tx, {
        userId: user.id,
        userEmail: user.email,
        createdBy: user.id,
        actor,
        source: 'checkout',
        origin: 'mp_online',
        dto,
        initialPaymentStatus: 'pendiente',
        paymentMethod: dto.paymentMethod ?? 'Tarjeta MP',
      }),
    );
  }

  // Pedido manual de Diego: nace pendiente + reserva 48h.
  async createManualOrder(
    admin: { id: string; name: string },
    dto: AdminCreateOrderDto,
  ): Promise<OrderWithItems> {
    const customer = await this.users.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
    const actor = { id: admin.id, name: admin.name };
    return this.prisma.$transaction((tx) =>
      this.buildOrder(tx, {
        userId: customer.id,
        userEmail: customer.email,
        createdBy: admin.id,
        actor,
        source: 'admin',
        origin: dto.origin ?? 'manual',
        dto,
        initialPaymentStatus: dto.paymentStatus ?? 'sin_registro',
        paymentMethod: dto.paymentMethod,
        courier: dto.courier,
        trackingCode: dto.trackingCode,
        pickupName: dto.pickupName,
        pickupDni: dto.pickupDni,
      }),
    );
  }

  async getMineOrFail(userId: string, id: string): Promise<OrderWithItems> {
    const order = await this.orders.findById(id);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  // Intentos de pago propios (para la página de confirmación/reintento).
  async listMyAttempts(userId: string, id: string) {
    const order = await this.getMineOrFail(userId, id);
    return this.attempts.listByOrder(order.id);
  }

  listMine(userId: string, page = 1, limit = 20) {
    const p = Math.max(1, page);
    const l = Math.max(1, Math.min(100, limit));
    return this.orders
      .listByUser(userId, (p - 1) * l, l)
      .then(([data, total]) => ({
        data,
        total,
        page: p,
        limit: l,
      }));
  }

  listAdmin(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    origin?: OrderOrigin;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
    return this.orders
      .listAdmin(
        {
          ...(filters.status && { status: filters.status }),
          ...(filters.paymentStatus && {
            paymentStatus: filters.paymentStatus,
          }),
          ...(filters.origin && { origin: filters.origin }),
          ...(filters.search && {
            OR: [
              { id: { startsWith: filters.search } },
              { couponCode: { contains: filters.search, mode: 'insensitive' } },
              {
                trackingCode: { contains: filters.search, mode: 'insensitive' },
              },
            ],
          }),
        },
        (page - 1) * limit,
        limit,
      )
      .then(([data, total]) => ({ data, total, page, limit }));
  }

  async getAdminOrFail(id: string) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    const [attempts, movements, audit] = await Promise.all([
      this.attempts.listByOrder(id),
      this.movements.listByOrder(id),
      this.audit.list({ entityType: 'order', entityId: id, limit: 50 }),
    ]);
    return { order, attempts, movements, audit: audit.data };
  }

  async cancelMine(userId: string, id: string) {
    const order = await this.getMineOrFail(userId, id);
    if (order.status !== 'pendiente') {
      throw new ConflictException('Solo se puede cancelar un pedido pendiente');
    }
    return this.transition(id, 'cancelado', { id: userId, name: userId });
  }

  async transition(
    id: string,
    to: OrderStatus,
    actor: AuditActor,
    via?: 'rma',
  ): Promise<OrderWithItems> {
    if (to === 'devuelto' && via !== 'rma') {
      throw new ForbiddenException(
        'El estado devuelto solo se genera al cerrar una devolución',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orders.findById(id, tx);
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (!VALID_TRANSITIONS[order.status].includes(to)) {
        throw new ConflictException(
          `No se puede cambiar de "${order.status}" a "${to}"`,
        );
      }
      const shouldRestore =
        order.stockReserved && (to === 'cancelado' || to === 'devuelto');
      if (shouldRestore) {
        await this.restoreStock(
          tx,
          order,
          to === 'cancelado' ? 'cancellation' : 'return',
          actor,
          to === 'cancelado' ? 'Pedido cancelado' : 'Pedido devuelto',
        );
      }
      const updated = await this.orders.update(
        id,
        {
          status: to,
          stockReserved: shouldRestore ? false : order.stockReserved,
          statusHistory: this.historyAppend(order, to, actor.id),
        },
        tx,
      );
      await this.audit.log(
        {
          entityType: 'order',
          entityId: id,
          entityLabel: orderLabel(id),
          action: 'status_change',
          summary: `Cambió el estado del pedido de ${order.status} a ${to}`,
          before: { status: order.status, stockReserved: order.stockReserved },
          after: {
            status: to,
            stockReserved: shouldRestore ? false : order.stockReserved,
          },
          changes: [
            { field: 'status', before: order.status, after: to },
            ...(order.stockReserved !==
            (shouldRestore ? false : order.stockReserved)
              ? [
                  {
                    field: 'stockReserved',
                    before: order.stockReserved,
                    after: false,
                  },
                ]
              : []),
          ],
          actor,
        },
        tx,
      );
      return updated;
    });
  }

  // Worker + trigger manual: cancela reservas vencidas sin pago,
  // libera stock, registra intento cancelado y audita como sistema.
  // Idempotente: el guard `updateMany` evita doble procesamiento.
  async expireStaleReservations(now: Date = new Date()): Promise<string[]> {
    const candidates = await this.orders.findExpirable(now);
    const processed: string[] = [];
    const actor = { id: 'sistema', name: 'Sistema' };
    for (const candidate of candidates) {
      await this.prisma.$transaction(async (tx) => {
        const order = await this.orders.findById(candidate.id, tx);
        if (
          !order ||
          order.status !== 'pendiente' ||
          !order.stockReserved ||
          (order.reservationExpiryAt &&
            order.reservationExpiryAt.getTime() > now.getTime()) ||
          !EXPIRABLE_PAYMENT_STATUSES.includes(order.paymentStatus)
        ) {
          return;
        }
        await this.restoreStock(
          tx,
          order,
          'release_reservation',
          actor,
          'Reserva expirada sin pago',
        );
        await this.orders.update(
          order.id,
          {
            status: 'cancelado',
            stockReserved: false,
            statusHistory: this.historyAppend(order, 'cancelado', 'sistema'),
          },
          tx,
        );
        await this.payments.recordAttempt(
          tx,
          order,
          {
            status: 'cancelado',
            amount: order.total,
            method: order.paymentMethod ?? undefined,
            reason: 'Reserva expirada sin pago',
            actor,
          },
          { updateOrderStatus: false },
        );
        await this.audit.log(
          {
            entityType: 'order',
            entityId: order.id,
            entityLabel: orderLabel(order.id),
            action: 'status_change',
            summary:
              'Reserva expirada sin pago: pedido cancelado y stock liberado',
            before: {
              status: order.status,
              stockReserved: order.stockReserved,
            },
            after: { status: 'cancelado', stockReserved: false },
            changes: [
              { field: 'status', before: order.status, after: 'cancelado' },
              {
                field: 'stockReserved',
                before: order.stockReserved,
                after: false,
              },
            ],
            actor,
          },
          tx,
        );
        processed.push(order.id);
      });
    }
    return processed;
  }

  // Reintento del cliente: nuevo intento pendiente (no duplica pedido/stock).
  async retryMine(userId: string, id: string) {
    const order = await this.getMineOrFail(userId, id);
    if (order.status !== 'pendiente') {
      throw new ConflictException(
        'Solo se puede reintentar un pedido pendiente',
      );
    }
    const attempts = await this.attempts.listByOrder(id);
    const last = attempts[attempts.length - 1];
    if (
      last &&
      (last.status === 'aprobado' ||
        last.status === 'verificado_manual' ||
        last.status === 'reembolsado')
    ) {
      throw new ConflictException('Este pedido ya tiene un pago válido');
    }
    return this.prisma.$transaction((tx) =>
      this.payments.recordAttempt(
        tx,
        order,
        {
          status: 'pendiente',
          amount: order.total,
          method: order.paymentMethod ?? 'Tarjeta MP',
          reason: 'Reintento de pago del cliente',
          actor: { id: userId, name: userId },
        },
        { updateOrderStatus: true },
      ),
    );
  }
}
