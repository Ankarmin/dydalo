import { Injectable } from '@nestjs/common';
import type { Prisma, StockMovement, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Tx } from '../coupons/coupons.repository';

export type MovementInput = {
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
};

// Kardex: append-only. Este repositorio solo CREA y LEE.
@Injectable()
export class MovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: MovementInput, tx?: Tx): Promise<StockMovement> {
    const db = tx ?? this.prisma;
    return db.stockMovement.create({ data });
  }

  createMany(items: MovementInput[], tx?: Tx) {
    if (items.length === 0) return Promise.resolve({ count: 0 });
    const db = tx ?? this.prisma;
    return db.stockMovement.createMany({ data: items });
  }

  list(where: Prisma.StockMovementWhereInput, skip: number, take: number) {
    // Solo lectura: siempre fuera de las tx de escritura.
    return this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
  }

  listByOrder(orderId: string, tx?: Tx): Promise<StockMovement[]> {
    const db = tx ?? this.prisma;
    return db.stockMovement.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
