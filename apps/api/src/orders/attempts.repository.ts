import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaymentAttempt } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Tx } from '../coupons/coupons.repository';

@Injectable()
export class AttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrder(orderId: string, tx?: Tx): Promise<PaymentAttempt[]> {
    const db = tx ?? this.prisma;
    return db.paymentAttempt.findMany({
      where: { orderId },
      orderBy: { attemptNumber: 'asc' },
    });
  }

  findByMpPaymentId(orderId: string, mpPaymentId: string, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.paymentAttempt.findFirst({ where: { orderId, mpPaymentId } });
  }

  // Número secuencial por pedido con reintento ante colisión
  // (unique orderId+attemptNumber): crea el intento de forma segura.
  async createSequential(
    tx: Tx,
    data: Omit<Prisma.PaymentAttemptCreateInput, 'attemptNumber'> & {
      order: { connect: { id: string } };
    },
  ): Promise<PaymentAttempt> {
    const orderId = data.order.connect.id;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const max = await tx.paymentAttempt.aggregate({
        where: { orderId },
        _max: { attemptNumber: true },
      });
      const attemptNumber = (max._max.attemptNumber ?? 0) + 1;
      try {
        return await tx.paymentAttempt.create({
          data: { ...data, attemptNumber },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002' &&
          attempt < 2
        ) {
          continue;
        }
        throw e;
      }
    }
    throw new Error('No se pudo registrar el intento de pago');
  }
}
