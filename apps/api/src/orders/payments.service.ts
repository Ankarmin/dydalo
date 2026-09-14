import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaymentStatus } from '@prisma/client';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import type { Tx } from '../coupons/coupons.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptsRepository } from './attempts.repository';
import { OrdersRepository } from './orders.repository';
import type { OrderWithItems } from './orders.repository';
import { orderLabel } from './orders.service';

// Mapeo estado MP → estado interno (simulador; Fase 7: webhook firmado).
const MP_STATUS_MAP: Array<{ match: RegExp; status: PaymentStatus }> = [
  { match: /^accredited$/, status: 'aprobado' },
  { match: /^pending_review_manual$/, status: 'en_revision' },
  { match: /^pending/, status: 'in_process' },
  { match: /^offline_pending$/, status: 'pendiente' },
  { match: /^cc_rejected|^rejected/, status: 'rechazado' },
  { match: /^refunded|^refound/, status: 'reembolsado' },
  { match: /^charged_back|^chargeback/, status: 'contracargo' },
  { match: /^in_dispute|^dispute/, status: 'en_disputa' },
  { match: /^cancelled$/, status: 'cancelado' },
];

export function mapMpStatus(mpStatus: string): PaymentStatus {
  const normalized = mpStatus.trim().toLowerCase();
  for (const { match, status } of MP_STATUS_MAP) {
    if (match.test(normalized)) return status;
  }
  return 'in_process';
}

export type AttemptInput = {
  status: PaymentStatus;
  amount: number;
  method?: string;
  mpPaymentId?: string;
  mpStatusDetail?: string;
  reason?: string;
  evidence?: string;
  actor: AuditActor;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly attempts: AttemptsRepository,
    private readonly audit: AuditService,
  ) {}

  // Crea el intento + actualiza el pedido + audita, todo en la tx dada.
  // Es el único camino para mutar `paymentStatus` (nunca directo).
  findAttemptByMpPaymentId(orderId: string, mpPaymentId: string) {
    return this.attempts.findByMpPaymentId(orderId, mpPaymentId);
  }

  async recordAttempt(
    tx: Tx,
    order: OrderWithItems,
    input: AttemptInput,
    options: { updateOrderStatus: boolean } = { updateOrderStatus: true },
  ) {
    const attempt = await this.attempts.createSequential(tx, {
      order: { connect: { id: order.id } },
      status: input.status,
      amount: input.amount,
      method: input.method,
      mpPaymentId: input.mpPaymentId,
      mpStatusDetail: input.mpStatusDetail,
      reason: input.reason,
      evidence: input.evidence,
      actorId: input.actor.id,
      actorName: input.actor.name,
    });
    let updated = order;
    if (options.updateOrderStatus) {
      updated = await this.orders.update(
        order.id,
        {
          paymentStatus: input.status,
          ...(input.method !== undefined && { paymentMethod: input.method }),
          ...(input.mpPaymentId !== undefined && {
            mpPaymentId: input.mpPaymentId,
          }),
        },
        tx,
      );
    }
    await this.audit.log(
      {
        entityType: 'order',
        entityId: order.id,
        entityLabel: orderLabel(order.id),
        action: 'status_change',
        summary: `Pago intento ${attempt.attemptNumber}: ${input.status}${input.reason ? ` — ${input.reason}` : ''}`,
        after: {
          paymentStatus: input.status,
          attemptNumber: attempt.attemptNumber,
        },
        changes: [
          {
            field: 'paymentStatus',
            before: order.paymentStatus,
            after: input.status,
          },
        ],
        actor: input.actor,
      },
      tx,
    );
    return { order: updated, attempt };
  }

  // Cambio manual de Diego (o del simulador): valida motivo/evidencia y,
  // al aprobar, audita la venta definitiva (la reserva ya descontó stock:
  // NO hay movimiento extra, paridad con el frontend).
  async updatePaymentStatus(
    orderId: string,
    input: {
      status: PaymentStatus;
      method?: string;
      mpPaymentId?: string;
      mpStatusDetail?: string;
      reason?: string;
      evidence?: string;
      actor: AuditActor;
    },
  ) {
    if (
      (input.status === 'en_revision' ||
        input.status === 'verificado_manual') &&
      !input.reason?.trim()
    ) {
      throw new BadRequestException('El motivo es obligatorio');
    }
    if (input.status === 'verificado_manual' && !input.evidence?.trim()) {
      throw new BadRequestException(
        'La evidencia del comprobante es obligatoria',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orders.findById(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
      const { order: updated, attempt } = await this.recordAttempt(
        tx,
        order,
        {
          status: input.status,
          amount: order.total,
          method: input.method ?? order.paymentMethod ?? undefined,
          mpPaymentId: input.mpPaymentId ?? order.mpPaymentId ?? undefined,
          mpStatusDetail: input.mpStatusDetail,
          reason: input.reason,
          evidence: input.evidence,
          actor: input.actor,
        },
        { updateOrderStatus: true },
      );
      if (input.status === 'aprobado' || input.status === 'verificado_manual') {
        await this.audit.log(
          {
            entityType: 'order',
            entityId: orderId,
            entityLabel: orderLabel(orderId),
            action: 'status_change',
            summary: `Reserva convertida en venta definitiva (${input.status})`,
            before: { reservation: true },
            after: { sale: true },
            changes: [
              {
                field: 'paymentStatus',
                before: order.paymentStatus,
                after: input.status,
              },
            ],
            actor: input.actor,
          },
          tx,
        );
      }
      return { order: updated, attempt };
    });
  }

  // Webhook simulado (admin, origen mp_online o manual con link MP).
  // Idempotente por mpPaymentId: no duplica intentos. El actor queda como
  // sistema_mp (igual que el webhook real de Fase 7).
  async simulateWebhook(
    orderId: string,
    input: { mpStatus: string; mpPaymentId?: string; mpStatusDetail?: string },
  ) {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.origin !== 'mp_online' && !order.manualWithMpLink) {
      throw new ConflictException(
        'Solo pedidos online (o manuales con link MP) reciben webhook',
      );
    }
    if (input.mpPaymentId) {
      const existing = await this.attempts.findByMpPaymentId(
        orderId,
        input.mpPaymentId,
      );
      if (existing) {
        return { order, attempt: existing, duplicate: true as const };
      }
    }
    const status = mapMpStatus(input.mpStatus);
    const result = await this.updatePaymentStatus(orderId, {
      status,
      mpPaymentId: input.mpPaymentId,
      mpStatusDetail: input.mpStatusDetail ?? input.mpStatus,
      reason: `Webhook MP simulado: ${input.mpStatus}`,
      actor: { id: 'sistema_mp', name: 'MercadoPago' },
    });
    return { ...result, duplicate: false as const };
  }

  // Alertas de `/admin/pagos`: revisión estancada (>24h) y
  // rechazo sin reintento (>2h), paridad con el frontend.
  async listAlerts(now: Date = new Date()) {
    const [stuck, rejected] = await Promise.all([
      this.findByLastAttempt(
        ['in_process', 'en_revision'],
        24 * 60 * 60 * 1000,
        now,
      ),
      this.findByLastAttempt(['rechazado'], 2 * 60 * 60 * 1000, now),
    ]);
    return { stuckInReview: stuck, rejectedWithoutRetry: rejected };
  }

  private async findByLastAttempt(
    statuses: PaymentStatus[],
    olderThanMs: number,
    now: Date,
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['pendiente', 'confirmado'] },
        paymentStatus: { in: statuses },
      },
      include: { attempts: { orderBy: { attemptNumber: 'desc' }, take: 1 } },
    });
    return orders
      .filter((o) => {
        const last = o.attempts[0];
        return last && now.getTime() - last.updatedAt.getTime() > olderThanMs;
      })
      .map((o) => ({
        orderId: o.id,
        label: orderLabel(o.id),
        total: o.total,
        paymentStatus: o.paymentStatus,
        since: o.attempts[0]?.updatedAt,
      }));
  }
}
