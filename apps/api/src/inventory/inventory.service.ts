import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import { ProductsRepository } from '../catalog/products/products.repository';
import { MovementsRepository } from '../orders/movements.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { AdjustStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsRepository,
    private readonly movements: MovementsRepository,
    private readonly audit: AuditService,
  ) {}

  // Ajuste directo (conteo físico / merma): delta aplicado con guardia
  // de no-negativo + movimiento + auditoría, todo en una transacción.
  adjust(dto: AdjustStockDto, actor: AuditActor) {
    if (dto.quantityChange === 0) {
      throw new BadRequestException('El ajuste no puede ser 0');
    }
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: dto.variantId, productId: dto.productId },
      });
      if (!variant) {
        throw new NotFoundException('Variante no encontrada');
      }
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }
      const after = variant.stock + dto.quantityChange;
      if (after < 0) {
        throw new ConflictException(
          `Stock insuficiente: solo quedan ${variant.stock}`,
        );
      }
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: after },
      });
      const movement = await this.movements.create(
        {
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          sku: product.sku,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          type: dto.type,
          quantityBefore: variant.stock,
          quantityChange: dto.quantityChange,
          quantityAfter: after,
          reason: dto.reason.trim(),
          createdBy: actor.id,
          createdByName: actor.name,
        },
        tx,
      );
      await this.products.recalcStock(product.id, tx);
      await this.audit.log(
        {
          entityType: 'inventory',
          entityId: variant.id,
          entityLabel: `${product.name} (${variant.size}/${variant.color})`,
          action: 'stock_change',
          summary:
            dto.type === 'damage'
              ? `Merma registrada: ${product.name} ${variant.size}/${variant.color} (${dto.quantityChange})`
              : `Ajuste de stock: ${product.name} ${variant.size}/${variant.color} (${dto.quantityChange > 0 ? '+' : ''}${dto.quantityChange})`,
          before: { stock: variant.stock },
          after: { stock: after },
          changes: [{ field: 'stock', before: variant.stock, after }],
          actor,
        },
        tx,
      );
      return movement;
    });
  }

  movementsByProduct(productId: string, variantId?: string) {
    return this.movements
      .list(
        {
          productId,
          ...(variantId && { variantId }),
        },
        0,
        200,
      )
      .then(([data, total]) => ({ data, total, page: 1, limit: 200 }));
  }

  movementsByOrder(orderId: string) {
    return this.movements.listByOrder(orderId);
  }
}
