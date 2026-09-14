import { Injectable } from '@nestjs/common';
import type { Prisma, ReturnItem, ReturnRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Tx } from '../coupons/coupons.repository';

export type ReturnWithItems = ReturnRequest & { items: ReturnItem[] };

const withItems = { items: { orderBy: { id: 'asc' as const } } };

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string, tx?: Tx): Promise<ReturnWithItems | null> {
    const db = tx ?? this.prisma;
    return db.returnRequest.findUnique({ where: { id }, include: withItems });
  }

  findByCode(code: string, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.returnRequest.findUnique({ where: { code } });
  }

  count(tx?: Tx): Promise<number> {
    const db = tx ?? this.prisma;
    return db.returnRequest.count();
  }

  listByUser(userId: string, tx?: Tx): Promise<ReturnWithItems[]> {
    const db = tx ?? this.prisma;
    return db.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: withItems,
    });
  }

  listAdmin(where: Prisma.ReturnRequestWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.returnRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: withItems,
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
  }

  listByOrder(orderId: string, tx?: Tx): Promise<ReturnWithItems[]> {
    const db = tx ?? this.prisma;
    return db.returnRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: withItems,
    });
  }

  create(data: Prisma.ReturnRequestCreateInput, tx: Tx) {
    return tx.returnRequest.create({ data, include: withItems });
  }

  update(id: string, data: Prisma.ReturnRequestUpdateInput, tx: Tx) {
    return tx.returnRequest.update({ where: { id }, data, include: withItems });
  }

  updateItem(id: string, data: Prisma.ReturnItemUpdateInput, tx: Tx) {
    return tx.returnItem.update({ where: { id }, data });
  }
}
