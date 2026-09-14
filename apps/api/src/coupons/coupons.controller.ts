import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/coupon.dto';

// Validación para el checkout: dice el descuento sin registrar uso
// (el uso se registra en la transacción de creación del pedido).
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(
    @CurrentUser() user: RequestUser,
    @Body() dto: ValidateCouponDto,
  ) {
    const result = await this.coupons.check(dto.code, {
      userId: user.id,
      email: user.email,
      subtotal: dto.subtotal,
    });
    if (!result.valid) {
      return { valid: false as const, error: result.error };
    }
    return {
      valid: true as const,
      code: result.code,
      discount: result.discount,
    };
  }
}
