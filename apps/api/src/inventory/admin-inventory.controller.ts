import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdjustStockDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('adjust')
  adjust(@CurrentUser() user: RequestUser, @Body() dto: AdjustStockDto) {
    return this.inventory.adjust(dto, { id: user.id, name: user.name });
  }

  @Get('movements/:productId')
  movements(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventory.movementsByProduct(productId, variantId);
  }

  @Get('orders/:orderId/movements')
  movementsByOrder(@Param('orderId') orderId: string) {
    return this.inventory.movementsByOrder(orderId);
  }
}
