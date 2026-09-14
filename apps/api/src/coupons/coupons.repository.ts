import { Injectable } from '@nestjs/common';
import type { Coupon, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type Tx = Prisma.TransactionClient;

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<Coupon[]> {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Coupon | null> {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  findByCode(code: string, tx?: Tx): Promise<Coupon | null> {
    const db = tx ?? this.prisma;
    return db.coupon.findUnique({ where: { code } });
  }

  create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    return this.prisma.coupon.create({ data });
  }

  update(id: string, data: Prisma.CouponUpdateInput): Promise<Coupon> {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  remove(id: string): Promise<Coupon> {
    return this.prisma.coupon.delete({ where: { id } });
  }

  findRedemption(couponId: string, userId: string, email: string, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.couponRedemption.findFirst({
      where: {
        couponId,
        OR: [{ userId }, ...(email ? [{ email }] : [])],
      },
    });
  }

  async hasRedemptions(id: string): Promise<boolean> {
    const count = await this.prisma.couponRedemption.count({
      where: { couponId: id },
    });
    return count > 0;
  }
}
