import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponType } from '@prisma/client';
import type { AuditActor } from '../audit/audit.service';
import { AuditService, diffObjects } from '../audit/audit.service';
import { CouponsRepository } from './coupons.repository';
import type { Tx } from './coupons.repository';
import type { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export type CouponCheck =
  | { valid: true; couponId: string; code: string; discount: number }
  | { valid: false; error: string };

// Paridad con `computeCouponDiscount` del frontend.
export function computeCouponDiscount(
  type: CouponType,
  value: number,
  subtotal: number,
): number {
  if (subtotal <= 0) return 0;
  if (type === 'PERCENT') {
    return Math.min(
      subtotal,
      Math.round(((subtotal * value) / 100) * 100) / 100,
    );
  }
  return Math.min(subtotal, value);
}

function assertValue(type: CouponType, value?: number | null): void {
  if (value === undefined || value === null) return;
  if (value <= 0) {
    throw new BadRequestException('El valor debe ser mayor a 0');
  }
  if (type === 'PERCENT' && value > 100) {
    throw new BadRequestException('El porcentaje no puede pasar de 100');
  }
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly coupons: CouponsRepository,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.coupons.list();
  }

  async create(dto: CreateCouponDto, actor: AuditActor) {
    assertValue(dto.type, dto.value);
    if (await this.coupons.findByCode(dto.code)) {
      throw new ConflictException('Ya existe un cupón con ese código');
    }
    const coupon = await this.coupons.create({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minSubtotal: dto.minSubtotal,
      maxUses: dto.maxUses,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      active: true,
      createdBy: actor.id,
      createdByName: actor.name,
    });
    await this.audit.log({
      entityType: 'discount',
      entityId: coupon.id,
      entityLabel: coupon.code,
      action: 'create',
      summary: `Creó cupón ${coupon.code}`,
      after: coupon,
      actor,
    });
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto, actor: AuditActor) {
    const before = await this.coupons.findById(id);
    if (!before) {
      throw new NotFoundException('Cupón no encontrado');
    }
    assertValue(dto.type ?? before.type, dto.value);
    const coupon = await this.coupons.update(id, {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.value !== undefined && { value: dto.value }),
      ...(dto.minSubtotal !== undefined && { minSubtotal: dto.minSubtotal }),
      ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      ...(dto.startsAt !== undefined && {
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      }),
      ...(dto.expiresAt !== undefined && {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      }),
      ...(dto.active !== undefined && { active: dto.active }),
    });
    await this.audit.log({
      entityType: 'discount',
      entityId: id,
      entityLabel: coupon.code,
      action: 'discount_change',
      summary: `Editó cupón ${coupon.code}`,
      before,
      after: coupon,
      changes: diffObjects(before, coupon),
      actor,
    });
    return coupon;
  }

  async remove(id: string, actor: AuditActor) {
    const before = await this.coupons.findById(id);
    if (!before) {
      throw new NotFoundException('Cupón no encontrado');
    }
    if (await this.coupons.hasRedemptions(id)) {
      throw new ConflictException(
        'No se puede eliminar: ya fue usado en pedidos (desactívalo)',
      );
    }
    await this.coupons.remove(id);
    await this.audit.log({
      entityType: 'discount',
      entityId: id,
      entityLabel: before.code,
      action: 'delete',
      summary: `Eliminó cupón ${before.code}`,
      before,
      actor,
    });
    return { success: true as const };
  }

  // Lectura para el checkout: NO registra uso (eso pasa en la tx del pedido).
  async check(
    code: string,
    input: { userId: string; email: string; subtotal: number },
  ): Promise<CouponCheck> {
    return this.validateCoupon(code, input);
  }

  async validateCoupon(
    code: string,
    input: { userId: string; email: string; subtotal: number },
    tx?: Tx,
  ): Promise<CouponCheck> {
    const coupon = await this.coupons.findByCode(code, tx);
    if (!coupon) return { valid: false, error: 'Cupón no válido.' };
    if (!coupon.active) return { valid: false, error: 'Cupón desactivado.' };
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
      return { valid: false, error: 'Cupón aún no vigente.' };
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
      return { valid: false, error: 'Cupón vencido.' };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'Cupón agotado.' };
    }
    const email = input.email.trim().toLowerCase();
    const used = await this.coupons.findRedemption(
      coupon.id,
      input.userId,
      email,
      tx,
    );
    if (used) return { valid: false, error: 'Ya usaste este cupón.' };
    if (coupon.minSubtotal !== null && input.subtotal < coupon.minSubtotal) {
      return {
        valid: false,
        error: `Requiere compra mínima de S/${coupon.minSubtotal}.`,
      };
    }
    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discount: computeCouponDiscount(
        coupon.type,
        coupon.value,
        input.subtotal,
      ),
    };
  }

  // Dentro de la tx de creación del pedido: revalida + registra uso con
  // guardias anti-doble-uso a nivel DB (unique + usedCount acotado).
  async registerUse(
    tx: Tx,
    couponId: string,
    input: { userId: string; email: string; orderId: string },
  ): Promise<void> {
    const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || !coupon.active) {
      throw new ConflictException('Cupón no válido.');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new ConflictException('Cupón agotado.');
    }
    const email = input.email.trim().toLowerCase();
    try {
      await tx.couponRedemption.create({
        data: {
          couponId,
          userId: input.userId,
          email,
          orderId: input.orderId,
        },
      });
    } catch {
      throw new ConflictException('Ya usaste este cupón.');
    }
    let bumped: boolean;
    if (coupon.maxUses === null) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      bumped = true;
    } else {
      const res = await tx.coupon.updateMany({
        where: { id: couponId, usedCount: { lt: coupon.maxUses } },
        data: { usedCount: { increment: 1 } },
      });
      bumped = res.count === 1;
    }
    if (!bumped) {
      throw new ConflictException('Cupón agotado.');
    }
  }
}
