import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ReturnOrigin, ReturnStatus } from '@prisma/client';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import { ProductsRepository } from '../catalog/products/products.repository';
import type { Tx } from '../coupons/coupons.repository';
import { MovementsRepository } from '../orders/movements.repository';
import { OrdersRepository } from '../orders/orders.repository';
import type { OrderWithItems } from '../orders/orders.repository';
import { OrdersService, orderLabel } from '../orders/orders.service';
import { PaymentsService } from '../orders/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminCreateReturnDto,
  CloseReturnDto,
  CreateReturnDto,
  InspectReturnDto,
  ReceiveReturnDto,
  SetReturnStatusDto,
} from './dto/return.dto';
import { ReturnsRepository } from './returns.repository';
import type { ReturnWithItems } from './returns.repository';

export const RETURN_SLA_DAYS = 7;

const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  solicitada: ['aprobada', 'rechazada'],
  aprobada: ['recibida', 'rechazada'],
  recibida: ['inspeccionada'],
  inspeccionada: ['cerrada'],
  rechazada: [],
  cerrada: [],
};

type StatusHistoryEntry = {
  from: string;
  to: string;
  at: string;
  by: string;
};

function padCode(n: number): string {
  return `RMA-${String(n).padStart(3, '0')}`;
}

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly returns: ReturnsRepository,
    private readonly orders: OrdersRepository,
    private readonly ordersService: OrdersService,
    private readonly payments: PaymentsService,
    private readonly products: ProductsRepository,
    private readonly movements: MovementsRepository,
    private readonly audit: AuditService,
  ) {}

  private deliveredAt(order: OrderWithItems): Date | null {
    const history = (order.statusHistory ?? []) as StatusHistoryEntry[];
    const last = [...history].reverse().find((h) => h.to === 'entregado');
    return last ? new Date(last.at) : null;
  }

  private assertWithinSla(order: OrderWithItems, now: Date = new Date()): void {
    const at = this.deliveredAt(order);
    if (
      !at ||
      now.getTime() - at.getTime() > RETURN_SLA_DAYS * 24 * 60 * 60 * 1000
    ) {
      throw new BadRequestException(
        `Fuera del plazo de ${RETURN_SLA_DAYS} días`,
      );
    }
  }

  private async alreadyReturnedQty(
    tx: Tx,
    orderId: string,
    productId: string,
    variantId: string,
  ): Promise<number> {
    const rmAs = await this.returns.listByOrder(orderId, tx);
    return rmAs
      .filter((r) => r.status !== 'rechazada')
      .flatMap((r) => r.items)
      .filter(
        (i) => i.productId === productId && (i.variantId ?? '') === variantId,
      )
      .reduce((sum, i) => sum + i.quantity, 0);
  }

  private log(
    tx: Tx,
    rma: ReturnWithItems,
    action: 'create' | 'update' | 'status_change',
    summary: string,
    actor: AuditActor,
    before?: unknown,
    after?: unknown,
  ) {
    return this.audit.log(
      {
        entityType: 'order',
        entityId: rma.orderId,
        entityLabel: rma.code,
        action,
        summary,
        before,
        after,
        actor,
      },
      tx,
    );
  }

  private async nextCode(tx: Tx): Promise<string> {
    const base = await this.returns.count(tx);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = padCode(base + 1 + attempt);
      if (!(await this.returns.findByCode(code, tx))) return code;
    }
    throw new ConflictException('No se pudo generar el código RMA');
  }

  async create(
    input: (CreateReturnDto | AdminCreateReturnDto) & {
      userId?: string;
      origin: ReturnOrigin;
      actor: AuditActor;
    },
  ): Promise<ReturnWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orders.findById(input.orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (order.status !== 'entregado') {
        throw new BadRequestException(
          'Solo pedidos entregados admiten devolución',
        );
      }
      this.assertWithinSla(order);
      if (input.items.length === 0) {
        throw new BadRequestException('Elige al menos un item');
      }
      const userId = input.userId ?? order.userId;
      if (!userId) {
        throw new BadRequestException('El pedido no tiene cliente asociado');
      }
      const items: Array<{
        productId: string;
        variantId?: string;
        name: string;
        size: string;
        color: string;
        price: number;
        unitCost?: number;
        quantity: number;
        reason: (typeof input.items)[number]['reason'];
        reasonNote?: string;
      }> = [];
      for (const req of input.items) {
        const orderItem = order.items.find(
          (i) =>
            i.productId === req.productId &&
            (i.variantId ?? '') === (req.variantId ?? ''),
        );
        if (!orderItem) {
          throw new BadRequestException('Item no pertenece al pedido');
        }
        if (req.quantity <= 0) {
          throw new BadRequestException('Cantidad inválida');
        }
        const available =
          orderItem.quantity -
          (await this.alreadyReturnedQty(
            tx,
            order.id,
            req.productId,
            req.variantId ?? '',
          ));
        if (req.quantity > available) {
          throw new BadRequestException(
            `Solo quedan ${available} uds devolvibles de ${orderItem.name}`,
          );
        }
        if (!req.reasonNote?.trim() && req.reason === 'otro') {
          throw new BadRequestException('Describe el motivo');
        }
        items.push({
          productId: orderItem.productId,
          variantId: orderItem.variantId ?? undefined,
          name: orderItem.name,
          size: orderItem.size,
          color: orderItem.color,
          price: orderItem.price,
          unitCost: orderItem.unitCost ?? undefined,
          quantity: req.quantity,
          reason: req.reason,
          reasonNote: req.reasonNote?.trim() || undefined,
        });
      }
      const code = await this.nextCode(tx);
      const rma = await this.returns.create(
        {
          code,
          order: { connect: { id: order.id } },
          userId,
          origin: input.origin,
          status: input.origin === 'admin' ? 'aprobada' : 'solicitada',
          createdBy: input.actor.id,
          createdByName: input.actor.name,
          items: { create: items },
        },
        tx,
      );
      await this.log(
        tx,
        rma,
        'create',
        `${code} ${input.origin === 'admin' ? 'creada por admin' : 'solicitada por cliente'} (${items.length} líneas)`,
        input.actor,
        undefined,
        rma,
      );
      return rma;
    });
  }

  listMine(userId: string) {
    return this.returns.listByUser(userId);
  }

  async getMineOrFail(userId: string, id: string) {
    const rma = await this.returns.findById(id);
    if (!rma || rma.userId !== userId) {
      throw new NotFoundException('Devolución no encontrada');
    }
    return rma;
  }

  listAdmin(filters: {
    status?: ReturnStatus;
    origin?: ReturnOrigin;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
    return this.returns
      .listAdmin(
        {
          ...(filters.status && { status: filters.status }),
          ...(filters.origin && { origin: filters.origin }),
          ...(filters.search && {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { orderId: { startsWith: filters.search } },
            ],
          }),
        },
        (page - 1) * limit,
        limit,
      )
      .then(([data, total]) => ({ data, total, page, limit }));
  }

  getAdminOrFail(id: string) {
    return this.returns.findById(id).then((rma) => {
      if (!rma) throw new NotFoundException('Devolución no encontrada');
      return rma;
    });
  }

  async setStatus(id: string, dto: SetReturnStatusDto, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const rma = await this.returns.findById(id, tx);
      if (!rma) {
        throw new NotFoundException('Devolución no encontrada');
      }
      if (!RETURN_TRANSITIONS[rma.status].includes(dto.status)) {
        throw new ConflictException(
          `No se puede pasar de "${rma.status}" a "${dto.status}"`,
        );
      }
      const updated = await this.returns.update(id, { status: dto.status }, tx);
      await this.log(
        tx,
        updated,
        'status_change',
        `${rma.code}: ${rma.status} → ${dto.status}${dto.note ? ` — ${dto.note}` : ''}`,
        actor,
        { status: rma.status },
        { status: dto.status },
      );
      return updated;
    });
  }

  async receive(
    id: string,
    dto: ReceiveReturnDto,
    actor: AuditActor,
  ): Promise<ReturnWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const rma = await this.returns.findById(id, tx);
      if (!rma || rma.status !== 'aprobada') {
        throw new BadRequestException('La devolución debe estar aprobada');
      }
      const items = rma.items.map((item) => {
        const req = dto.lines.find(
          (l) =>
            l.productId === item.productId &&
            (l.variantId ?? '') === (item.variantId ?? ''),
        );
        const qty = Math.min(req?.quantity ?? item.quantity, item.quantity);
        return { id: item.id, receivedQuantity: qty };
      });
      if (items.every((i) => i.receivedQuantity === 0)) {
        throw new BadRequestException('Indica lo recibido por línea');
      }
      for (const item of items) {
        await this.returns.updateItem(
          item.id,
          { receivedQuantity: item.receivedQuantity },
          tx,
        );
      }
      const updated = await this.returns.update(id, { status: 'recibida' }, tx);
      await this.log(
        tx,
        updated,
        'status_change',
        `${rma.code} recibida en almacén`,
        actor,
        { status: rma.status },
        { status: 'recibida' },
      );
      return updated;
    });
  }

  async inspect(
    id: string,
    dto: InspectReturnDto,
    actor: AuditActor,
  ): Promise<ReturnWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const rma = await this.returns.findById(id, tx);
      if (!rma || rma.status !== 'recibida') {
        throw new BadRequestException('La devolución debe estar recibida');
      }
      for (const item of rma.items) {
        const req = dto.lines.find(
          (l) =>
            l.productId === item.productId &&
            (l.variantId ?? '') === (item.variantId ?? ''),
        );
        const restock = req?.restock ?? 0;
        const damage = req?.damage ?? 0;
        if (
          restock < 0 ||
          damage < 0 ||
          restock + damage !== item.receivedQuantity
        ) {
          throw new BadRequestException(
            `En ${item.name}: reingreso + damage debe sumar lo recibido (${item.receivedQuantity})`,
          );
        }
      }
      for (const item of rma.items) {
        const req = dto.lines.find(
          (l) =>
            l.productId === item.productId &&
            (l.variantId ?? '') === (item.variantId ?? ''),
        );
        await this.returns.updateItem(
          item.id,
          {
            restockQuantity: req?.restock ?? 0,
            damageQuantity: req?.damage ?? 0,
            evidence: req?.evidence?.trim() || item.evidence,
          },
          tx,
        );
        const restock = req?.restock ?? 0;
        if (restock > 0 && item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (variant && product) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: restock } },
            });
            await this.movements.create(
              {
                productId: product.id,
                productName: product.name,
                productImage: product.image,
                sku: product.sku,
                variantId: variant.id,
                size: variant.size,
                color: variant.color,
                type: 'return',
                quantityBefore: variant.stock,
                quantityChange: restock,
                quantityAfter: variant.stock + restock,
                orderId: rma.orderId,
                reason: `${rma.code} · ${item.name}`,
                createdBy: actor.id,
                createdByName: actor.name,
              },
              tx,
            );
            await this.products.recalcStock(product.id, tx);
          }
        }
      }
      const updated = await this.returns.update(
        id,
        { status: 'inspeccionada' },
        tx,
      );
      const restocked = updated.items.reduce(
        (s, i) => s + i.restockQuantity,
        0,
      );
      const damaged = updated.items.reduce((s, i) => s + i.damageQuantity, 0);
      await this.log(
        tx,
        updated,
        'status_change',
        `${rma.code} inspeccionada: ${restocked} reingresan, ${damaged} a damage`,
        actor,
        { status: rma.status },
        { status: 'inspeccionada' },
      );
      return updated;
    });
  }

  // Merma al cerrar: si el pedido ya está `devuelto` se netea del stock
  // (movimiento `damage` real); si no, queda movimiento informativo
  // `quantityChange: 0` (paridad frontend: sin stock que netear).
  private async recordDamage(
    tx: Tx,
    rma: ReturnWithItems,
    nettable: boolean,
    actor: AuditActor,
  ): Promise<string[]> {
    const warnings: string[] = [];
    for (const item of rma.items) {
      if (item.damageQuantity <= 0) continue;
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      const variant = item.variantId
        ? await tx.productVariant.findUnique({
            where: { id: item.variantId },
          })
        : null;
      if (!product || !variant) {
        warnings.push(
          `Sin merma en kardex para ${item.name}: producto o variante no encontrado`,
        );
        continue;
      }
      if (nettable) {
        const res = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.damageQuantity } },
          data: { stock: { decrement: item.damageQuantity } },
        });
        if (res.count === 0) {
          warnings.push(
            `Sin merma en kardex para ${item.name}: stock insuficiente`,
          );
          continue;
        }
        await this.movements.create(
          {
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            sku: product.sku,
            variantId: variant.id,
            size: variant.size,
            color: variant.color,
            type: 'damage',
            quantityBefore: variant.stock,
            quantityChange: -item.damageQuantity,
            quantityAfter: variant.stock - item.damageQuantity,
            orderId: rma.orderId,
            reason: `${rma.code} · merma no vendible`,
            createdBy: actor.id,
            createdByName: actor.name,
          },
          tx,
        );
        await this.products.recalcStock(product.id, tx);
      } else {
        await this.movements.create(
          {
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            sku: product.sku,
            variantId: variant.id,
            size: variant.size,
            color: variant.color,
            type: 'damage',
            quantityBefore: variant.stock,
            quantityChange: 0,
            quantityAfter: variant.stock,
            orderId: rma.orderId,
            reason: `${rma.code} · merma no vendible (informativa, sin stock que netear)`,
            createdBy: actor.id,
            createdByName: actor.name,
          },
          tx,
        );
      }
    }
    return warnings;
  }

  async close(id: string, dto: CloseReturnDto, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const rma = await this.returns.findById(id, tx);
      if (!rma || rma.status !== 'inspeccionada') {
        throw new BadRequestException('La devolución debe estar inspeccionada');
      }
      const approvedTotal = rma.items.reduce(
        (s, i) => s + i.price * i.quantity,
        0,
      );
      if (dto.refundAmount < 0 || dto.refundAmount > approvedTotal) {
        throw new BadRequestException(
          `Reembolso máximo S/${approvedTotal.toFixed(2)}`,
        );
      }
      const order = await this.orders.findById(rma.orderId, tx);
      // ¿Todo el pedido devuelto (cerradas + esta)? → pedido `devuelto`.
      const siblings = await this.returns.listByOrder(rma.orderId, tx);
      const allReturned =
        !!order &&
        order.items.every((oi) => {
          const totalReturned = siblings
            .filter((r) => r.status === 'cerrada' || r.id === rma.id)
            .flatMap((r) => r.items)
            .filter(
              (i) =>
                i.productId === oi.productId &&
                (i.variantId ?? '') === (oi.variantId ?? ''),
            )
            .reduce((s, i) => s + i.quantity, 0);
          return totalReturned >= oi.quantity;
        });
      if (allReturned && order && order.status === 'entregado') {
        // Transición con vía RMA (única forma de llegar a `devuelto`).
        // Nota: corre dentro de esta tx para no partir la operación.
        await this.transitionToReturned(tx, order.id, actor);
      }
      const refreshed = await this.orders.findById(rma.orderId, tx);
      const nettable = refreshed?.status === 'devuelto';
      const damageWarnings = await this.recordDamage(tx, rma, nettable, actor);
      if (dto.refundAmount > 0) {
        await this.payments.recordAttempt(
          tx,
          refreshed ?? (await this.orders.findById(rma.orderId, tx))!,
          {
            status: 'reembolsado',
            amount: dto.refundAmount,
            reason: `${rma.code}: reembolso S/${dto.refundAmount.toFixed(2)}${dto.refundNote ? ` — ${dto.refundNote}` : ''}`,
            actor,
          },
          { updateOrderStatus: true },
        );
      }
      const updated = await this.returns.update(
        id,
        {
          status: 'cerrada',
          refundAmount: dto.refundAmount,
          refundNote: dto.refundNote?.trim() || undefined,
        },
        tx,
      );
      const damageSummary =
        damageWarnings.length > 0
          ? ` Advertencias: ${damageWarnings.join('; ')}`
          : rma.items.some((i) => i.damageQuantity > 0)
            ? ` (${rma.items.reduce((s, i) => s + i.restockQuantity, 0)} reingresan, ${rma.items.reduce((s, i) => s + i.damageQuantity, 0)} a merma)`
            : '';
      await this.log(
        tx,
        updated,
        'status_change',
        `${rma.code} cerrada con reembolso S/${dto.refundAmount.toFixed(2)}${damageSummary}`,
        actor,
        { status: rma.status },
        { status: 'cerrada' },
      );
      return { rma: updated, warnings: damageWarnings };
    });
  }

  // Replica `OrdersService.transition(...,'devuelto',actor,'rma')` dentro
  // de la tx del cierre (sin abrir una tx anidada).
  private async transitionToReturned(
    tx: Tx,
    orderId: string,
    actor: AuditActor,
  ): Promise<void> {
    const order = await this.orders.findById(orderId, tx);
    if (!order || order.status !== 'entregado') return;
    const updated = await this.orders.update(
      orderId,
      {
        status: 'devuelto',
        stockReserved: false,
        statusHistory: [
          ...((order.statusHistory ?? []) as StatusHistoryEntry[]),
          {
            from: order.status,
            to: 'devuelto',
            at: new Date().toISOString(),
            by: actor.id,
          },
        ],
      },
      tx,
    );
    void updated;
    await this.audit.log(
      {
        entityType: 'order',
        entityId: orderId,
        entityLabel: orderLabel(orderId),
        action: 'status_change',
        summary: `Pedido ${orderLabel(orderId)} devuelto vía RMA`,
        before: { status: order.status },
        after: { status: 'devuelto' },
        changes: [{ field: 'status', before: order.status, after: 'devuelto' }],
        actor,
      },
      tx,
    );
  }
}
