import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import { ProductsRepository } from '../catalog/products/products.repository';
import type { Tx } from '../coupons/coupons.repository';
import { MovementsRepository } from '../orders/movements.repository';
import type { MovementInput } from '../orders/movements.repository';
import { PrismaService } from '../prisma/prisma.service';
import { SuppliersRepository } from '../suppliers/suppliers.repository';
import type { CreatePurchaseDto, ReceivePurchaseDto } from './dto/purchase.dto';
import { PurchasesRepository } from './purchases.repository';

function padCode(n: number): string {
  return `OC-${String(n).padStart(3, '0')}`;
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchases: PurchasesRepository,
    private readonly suppliers: SuppliersRepository,
    private readonly products: ProductsRepository,
    private readonly movements: MovementsRepository,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.purchases.list();
  }

  detail(id: string) {
    return this.purchases.findById(id).then((p) => {
      if (!p) throw new NotFoundException('Compra no encontrada');
      return p;
    });
  }

  // Código secuencial OC-### con reintento ante colisión (unique).
  private async nextCode(tx: Tx): Promise<string> {
    const base = await this.purchases.count(tx);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = padCode(base + 1 + attempt);
      if (!(await this.purchases.findByCode(code, tx))) return code;
    }
    throw new ConflictException('No se pudo generar el código de compra');
  }

  async create(dto: CreatePurchaseDto, actor: AuditActor) {
    if (dto.lines.length === 0) {
      throw new BadRequestException('La compra necesita al menos una línea');
    }
    const supplier = await this.suppliers.findById(dto.supplierId);
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    if (!supplier.active) {
      throw new ConflictException('El proveedor está desactivado');
    }
    return this.prisma.$transaction(async (tx) => {
      const lines: Array<{
        productId: string;
        productName: string;
        variantId?: string;
        quantity: number;
        unitCost: number;
      }> = [];
      for (const line of dto.lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto no encontrado: ${line.productId}`,
          );
        }
        if (line.quantity <= 0 || line.unitCost < 0) {
          throw new BadRequestException('Cantidad/costo inválidos');
        }
        if (line.variantId) {
          const variant = product.variants.find((v) => v.id === line.variantId);
          if (!variant) {
            throw new NotFoundException(
              `Variante no encontrada en ${product.name}`,
            );
          }
        }
        lines.push({
          productId: product.id,
          productName: product.name,
          variantId: line.variantId,
          quantity: line.quantity,
          unitCost: line.unitCost,
        });
      }
      const code = await this.nextCode(tx);
      const order = await this.purchases.create(
        {
          code,
          supplier: { connect: { id: supplier.id } },
          supplierName: supplier.name,
          status: 'pendiente',
          note: dto.note?.trim() || undefined,
          createdBy: actor.id,
          createdByName: actor.name,
          lines: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              variantId: l.variantId,
              quantity: l.quantity,
              receivedQuantity: 0,
              unitCost: l.unitCost,
            })),
          },
        },
        tx,
      );
      await this.audit.log(
        {
          entityType: 'inventory',
          entityId: order.id,
          entityLabel: code,
          action: 'create',
          summary: `Creó ${code} a ${supplier.name} (${lines.length} líneas)`,
          after: order,
          actor,
        },
        tx,
      );
      return order;
    });
  }

  // Recepción (parcial o total): capa por pendiente, suma stock con
  // movimientos `purchase`, actualiza `costPrice` y audita. Todo en 1 tx.
  async receive(id: string, dto: ReceivePurchaseDto, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.purchases.findById(id, tx);
      if (!order) {
        throw new NotFoundException('Compra no encontrada');
      }
      if (order.status === 'recibida' || order.status === 'cancelada') {
        throw new ConflictException(`La compra ya está ${order.status}`);
      }
      let receivedNow = 0;
      for (const line of order.lines) {
        const req = dto.lines.find((l) => l.productId === line.productId);
        if (!req || req.quantity <= 0) continue;
        const pending = line.quantity - line.receivedQuantity;
        const qty = Math.min(req.quantity, pending);
        if (qty <= 0) continue;
        await this.applyReception(tx, order.id, order.code, line, qty, actor);
        await this.purchases.updateLine(
          line.id,
          { receivedQuantity: line.receivedQuantity + qty },
          tx,
        );
        receivedNow += qty;
      }
      if (receivedNow === 0) {
        throw new BadRequestException('Sin cantidades pendientes por recibir');
      }
      const refreshed = await this.purchases.findById(id, tx);
      if (!refreshed) throw new NotFoundException('Compra no encontrada');
      const allReceived = refreshed.lines.every(
        (l) => l.receivedQuantity >= l.quantity,
      );
      const updated = await this.purchases.update(
        id,
        { status: allReceived ? 'recibida' : 'parcial' },
        tx,
      );
      await this.audit.log(
        {
          entityType: 'inventory',
          entityId: id,
          entityLabel: order.code,
          action: 'update',
          summary: `Recibió ${receivedNow} uds de ${order.code} (${updated.status})`,
          before: { status: order.status },
          after: { status: updated.status },
          changes: [
            { field: 'status', before: order.status, after: updated.status },
          ],
          actor,
        },
        tx,
      );
      return updated;
    });
  }

  private async applyReception(
    tx: Tx,
    orderId: string,
    code: string,
    line: {
      id: string;
      productId: string;
      productName: string;
      variantId: string | null;
      unitCost: number;
    },
    qty: number,
    actor: AuditActor,
  ): Promise<void> {
    const product = await tx.product.findUnique({
      where: { id: line.productId },
      include: { variants: true },
    });
    if (!product || product.variants.length === 0) return;
    const forcedVariant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId)
      : undefined;
    if (line.variantId && !forcedVariant) {
      throw new NotFoundException(`Variante no encontrada en ${product.name}`);
    }
    const targets =
      forcedVariant && forcedVariant.active
        ? [forcedVariant]
        : (() => {
            const active = product.variants.filter((v) => v.active);
            return active.length > 0 ? active : product.variants;
          })();
    // Reparto floor+resto (paridad frontend) cuando no hay variante forzada.
    const perVariant = Math.floor(qty / targets.length);
    const remainder = qty % targets.length;
    const movements: MovementInput[] = [];
    for (let i = 0; i < targets.length; i += 1) {
      const v = targets[i];
      const q = forcedVariant ? qty : perVariant + (i < remainder ? 1 : 0);
      if (q <= 0) continue;
      const before = v.stock;
      await tx.productVariant.update({
        where: { id: v.id },
        data: { stock: { increment: q } },
      });
      movements.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        sku: product.sku,
        variantId: v.id,
        size: v.size,
        color: v.color,
        type: 'purchase',
        quantityBefore: before,
        quantityChange: q,
        quantityAfter: before + q,
        orderId,
        reason: `Recepción ${code} · ${product.name}`,
        createdBy: actor.id,
        createdByName: actor.name,
      });
    }
    await this.movements.createMany(movements, tx);
    await this.products.recalcStock(product.id, tx);
    const previousCost = product.costPrice;
    await tx.product.update({
      where: { id: product.id },
      data: { costPrice: line.unitCost },
    });
    await this.audit.log(
      {
        entityType: 'product',
        entityId: product.id,
        entityLabel: product.name,
        action: 'update',
        summary: `Actualizó costo de ${product.name} por Recepción ${code}`,
        before: { costPrice: previousCost },
        after: { costPrice: line.unitCost },
        changes: [
          {
            field: 'costPrice',
            before: previousCost ?? null,
            after: line.unitCost,
          },
        ],
        actor,
      },
      tx,
    );
  }

  async cancel(id: string, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.purchases.findById(id, tx);
      if (!order) {
        throw new NotFoundException('Compra no encontrada');
      }
      if (order.status === 'recibida' || order.status === 'cancelada') {
        throw new ConflictException(`La compra ya está ${order.status}`);
      }
      const updated = await this.purchases.update(
        id,
        { status: 'cancelada' },
        tx,
      );
      await this.audit.log(
        {
          entityType: 'inventory',
          entityId: id,
          entityLabel: order.code,
          action: 'status_change',
          summary: `Canceló ${order.code}`,
          before: { status: order.status },
          after: { status: 'cancelada' },
          changes: [
            { field: 'status', before: order.status, after: 'cancelada' },
          ],
          actor,
        },
        tx,
      );
      return updated;
    });
  }
}
