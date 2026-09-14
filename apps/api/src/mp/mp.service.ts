import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersRepository } from '../orders/orders.repository';
import { PaymentsService } from '../orders/payments.service';
import { buildPreferenceBody, mapMpPaymentStatus } from './mp-mapper';
import type { MpPayment } from './mp-mapper';
import { verifyWebhookSignature } from './mp-signature';

const MP_API = 'https://api.mercadopago.com';
const FINAL_PAYMENT_STATUSES = [
  'aprobado',
  'verificado_manual',
  'reembolsado',
] as const;

type MpPaymentRaw = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
};

function toMpPayment(data: MpPaymentRaw, fallbackId: string): MpPayment {
  return {
    id: String(data.id ?? fallbackId),
    status: data.status ?? '',
    statusDetail: data.status_detail,
    externalReference: data.external_reference,
    transactionAmount: data.transaction_amount,
  };
}

export type MpPreferenceResult =
  | { mock: true }
  | { mock: false; initPoint: string; preferenceId: string; sandbox: boolean };

// MercadoPago por REST directo (sin SDK: evita el riesgo ESM y deja el
// flujo auditable). Sin MP_ACCESS_TOKEN todo opera en mock (dev local).
@Injectable()
export class MpService {
  private readonly logger = new Logger(MpService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly orders: OrdersRepository,
    private readonly payments: PaymentsService,
  ) {}

  private token(): string {
    return this.config.get<string>('MP_ACCESS_TOKEN') ?? '';
  }

  isConfigured(): boolean {
    return this.token().length > 0;
  }

  isSandbox(): boolean {
    if ((this.config.get<string>('MP_SANDBOX') ?? 'false') === 'true') {
      return true;
    }
    return this.token().startsWith('TEST-');
  }

  // Preferencia de Checkout Pro para un pedido pendiente del dueño/admin.
  async createPreferenceForOrder(
    orderId: string,
    user: { id: string; role: string },
  ): Promise<MpPreferenceResult> {
    const order = await this.orders.findById(orderId);
    if (!order || (order.userId !== user.id && user.role !== 'admin')) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.status !== 'pendiente') {
      throw new ConflictException('Solo pedidos pendientes pueden pagarse');
    }
    if (
      (FINAL_PAYMENT_STATUSES as readonly string[]).includes(
        order.paymentStatus,
      )
    ) {
      throw new ConflictException('Este pedido ya tiene un pago válido');
    }
    if (!this.isConfigured()) {
      return { mock: true };
    }
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const notificationUrl = `${(this.config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:3001').replace(/\/$/, '')}/payments/webhook`;
    const body = buildPreferenceBody({
      orderId: order.id,
      orderLabel: order.id.slice(0, 8),
      payerEmail: undefined,
      items: order.items.map((i) => ({
        id: i.productId,
        title: `${i.name} ${i.size}/${i.color}`,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      frontendUrl,
      notificationUrl,
      autoReturn: frontendUrl.startsWith('https://'),
    });
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      this.logger.error(`MP preference falló: ${res.status}`);
      throw new BadGatewayException(
        'MercadoPago no pudo crear la preferencia de pago',
      );
    }
    const data = (await res.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };
    const sandbox = this.isSandbox();
    const initPoint =
      (sandbox
        ? (data.sandbox_init_point ?? data.init_point)
        : data.init_point) ?? '';
    if (!initPoint) {
      throw new BadGatewayException('MercadoPago no devolvió URL de pago');
    }
    return { mock: false, initPoint, preferenceId: data.id ?? '', sandbox };
  }

  async fetchPayment(mpPaymentId: string): Promise<MpPayment> {
    const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${this.token()}` },
    });
    if (!res.ok) {
      throw new BadGatewayException('No se pudo consultar el pago en MP');
    }
    const data = (await res.json()) as {
      id?: number | string;
      status?: string;
      status_detail?: string;
      external_reference?: string;
      transaction_amount?: number;
    };
    return toMpPayment(data, mpPaymentId);
  }

  // Busca pagos por external_reference (el orderId que mandamos al crear
  // la preferencia), del más reciente al más antiguo.
  async searchPayments(externalReference: string): Promise<MpPayment[]> {
    const res = await fetch(
      `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${this.token()}` } },
    );
    if (!res.ok) {
      throw new BadGatewayException('No se pudo consultar pagos en MP');
    }
    const data = (await res.json()) as {
      results?: Array<{
        id?: number | string;
        status?: string;
        status_detail?: string;
        external_reference?: string;
        transaction_amount?: number;
      }>;
    };
    return (data.results ?? []).map((p, i) => toMpPayment(p, `search-${i}`));
  }

  private requireConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'MercadoPago no configurado (MP_ACCESS_TOKEN)',
      );
    }
  }

  // Núcleo compartido webhook/sync: idempotencia + aplicación del estado.
  private async applyPayment(
    orderId: string,
    payment: MpPayment,
    reason: string,
  ) {
    const status = mapMpPaymentStatus(payment.status);
    if (!status) {
      this.logger.warn(`Estado MP desconocido: ${payment.status}`);
      return { applied: false as const, reason: 'unknown-status' as const };
    }
    const existing = await this.payments.findAttemptByMpPaymentId(
      orderId,
      payment.id,
    );
    if (existing) {
      const order = await this.orders.findById(orderId);
      return {
        applied: false as const,
        duplicate: true as const,
        order,
        attempt: existing,
      };
    }
    const result = await this.payments.updatePaymentStatus(orderId, {
      status,
      mpPaymentId: payment.id,
      mpStatusDetail: payment.statusDetail,
      reason,
      actor: { id: 'sistema_mp', name: 'MercadoPago' },
    });
    return { applied: true as const, ...result };
  }

  // Webhook real de MP. Falla cerrado: firma inválida → 401.
  // Idempotente por mpPaymentId (reintentos de MP no duplican).
  async handleWebhook(input: {
    type?: string;
    dataId?: string;
    xSignature?: string;
    xRequestId?: string;
  }) {
    if (input.type !== 'payment' || !input.dataId) {
      return { ignored: true as const };
    }
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET') ?? '';
    const valid = verifyWebhookSignature({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId,
      secret,
    });
    if (!valid) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'MercadoPago no configurado (MP_ACCESS_TOKEN)',
      );
    }
    const payment = await this.fetchPayment(input.dataId);
    const orderId = payment.externalReference;
    if (!orderId) {
      this.logger.warn(`Webhook MP sin external_reference: ${payment.id}`);
      return { ignored: true as const, reason: 'no-order' as const };
    }
    const order = await this.orders.findById(orderId);
    if (!order) {
      this.logger.warn(`Webhook MP de pedido inexistente: ${orderId}`);
      return { ignored: true as const, reason: 'order-not-found' as const };
    }
    const applied = await this.applyPayment(
      orderId,
      payment,
      `Webhook MP: pago ${payment.id} (${payment.status})`,
    );
    if (!applied.applied) {
      return applied.duplicate
        ? { duplicate: true as const, order, attempt: applied.attempt }
        : { ignored: true as const, reason: applied.reason };
    }
    return {
      duplicate: false as const,
      order: applied.order,
      attempt: applied.attempt,
    };
  }

  // Sincronización manual (dueño/admin): trae el último pago de MP para
  // el pedido y lo aplica. Sirve en local (sin webhook entrante) y como
  // reconciliación en producción si un webhook se pierde.
  async syncOrderPayment(orderId: string, user: { id: string; role: string }) {
    const order = await this.orders.findById(orderId);
    if (!order || (order.userId !== user.id && user.role !== 'admin')) {
      throw new NotFoundException('Pedido no encontrado');
    }
    this.requireConfigured();
    const payments = await this.searchPayments(orderId);
    if (payments.length === 0) {
      return { synced: false as const, reason: 'no-payments' as const };
    }
    const latest = payments[0];
    const applied = await this.applyPayment(
      orderId,
      latest,
      `Sincronización MP: pago ${latest.id} (${latest.status})`,
    );
    if (!applied.applied) {
      return applied.duplicate
        ? {
            synced: false as const,
            duplicate: true as const,
            order,
            attempt: applied.attempt,
          }
        : { synced: false as const, reason: applied.reason };
    }
    return {
      synced: true as const,
      order: applied.order,
      attempt: applied.attempt,
    };
  }
}
