import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MpService } from './mp.service';

@Controller()
export class MpController {
  constructor(private readonly mp: MpService) {}

  // Preferencia de Checkout Pro para pagar un pedido pendiente.
  // Sin MP_ACCESS_TOKEN responde `{ mock: true }` (flujo dev actual).
  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/mp-preference')
  createPreference(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mp.createPreferenceForOrder(id, {
      id: user.id,
      role: user.role,
    });
  }

  // Sincronización manual (dueño/admin): consulta en MP el último pago
  // del pedido y lo aplica. Reemplaza al webhook en local y reconcilia
  // en producción si alguna notificación se pierde.
  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/mp-sync')
  syncPayment(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mp.syncOrderPayment(id, { id: user.id, role: user.role });
  }

  // Webhook real de MercadoPago. Público (MP no tiene sesión):
  // la seguridad es la firma HMAC + throttle estricto.
  // Responde 200 ante todo lo procesable; 401 con firma inválida.
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Query() query: Record<string, unknown>,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    // Express parsea `data.id` como anidado (`{ data: { id } }`).
    const nested = query.data as { id?: unknown } | undefined;
    const rawId = query['data.id'] ?? nested?.id;
    const dataId =
      typeof rawId === 'string' || typeof rawId === 'number'
        ? String(rawId)
        : undefined;
    const type = typeof query.type === 'string' ? query.type : undefined;
    return this.mp.handleWebhook({ type, dataId, xSignature, xRequestId });
  }

  @Get('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhookVerify() {
    return { ok: true };
  }
}
