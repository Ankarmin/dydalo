import { Injectable } from '@nestjs/common';
import type { Prisma, PurchaseLine, PurchaseOrder } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Tx } from '../coupons/coupons.repository';

export type PurchaseWithLines = PurchaseOrder & { lines: PurchaseLine[] };

const withLines = { lines: { orderBy: { id: 'asc' as const } } };

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<PurchaseWithLines[]> {
    return this.prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: withLines,
    });
  }

  findById(id: string, tx?: Tx): Promise<PurchaseWithLines | null> {
    const db = tx ?? this.prisma;
    return db.purchaseOrder.findUnique({ where: { id }, include: withLines });
  }

  findByCode(code: string, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.purchaseOrder.findUnique({ where: { code } });
  }

  count(tx?: Tx): Promise<number> {
    const db = tx ?? this.prisma;
    return db.purchaseOrder.count();
  }

  create(data: Prisma.PurchaseOrderCreateInput, tx: Tx) {
    return tx.purchaseOrder.create({ data, include: withLines });
  }

  update(id: string, data: Prisma.PurchaseOrderUpdateInput, tx: Tx) {
    return tx.purchaseOrder.update({ where: { id }, data, include: withLines });
  }

  updateLine(id: string, data: Prisma.PurchaseLineUpdateInput, tx: Tx) {
    return tx.purchaseLine.update({ where: { id }, data });
  }
}
