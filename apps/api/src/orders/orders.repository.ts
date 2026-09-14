import { Injectable } from '@nestjs/common';
import type { Order, OrderItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Tx } from '../coupons/coupons.repository';

export type OrderWithItems = Order & { items: OrderItem[] };

const withItems = { items: { orderBy: { id: 'asc' as const } } };

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.order.findUnique({ where: { id }, include: withItems });
  }

  listByUser(userId: string, skip: number, take: number) {
    // Solo lectura: siempre fuera de la tx del pedido.
    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: withItems,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
  }

  listAdmin(where: Prisma.OrderWhereInput, skip: number, take: number) {
    // Solo lectura: siempre fuera de la tx del pedido.
    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: { orderBy: { id: 'asc' } } },
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  create(data: Prisma.OrderCreateInput, tx: Tx) {
    return tx.order.create({ data, include: withItems });
  }

  update(id: string, data: Prisma.OrderUpdateInput, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.order.update({ where: { id }, data, include: withItems });
  }

  findExpirable(now: Date, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.order.findMany({
      where: {
        status: 'pendiente',
        stockReserved: true,
        reservationExpiryAt: { lte: now },
        paymentStatus: {
          in: [
            'sin_registro',
            'pendiente',
            'in_process',
            'rechazado',
            'en_revision',
          ],
        },
      },
      include: withItems,
    });
  }
}
