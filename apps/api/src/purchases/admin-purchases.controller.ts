import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePurchaseDto, ReceivePurchaseDto } from './dto/purchase.dto';
import { PurchasesService } from './purchases.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/purchases')
export class AdminPurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  list() {
    return this.purchases.list();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.purchases.detail(id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePurchaseDto) {
    return this.purchases.create(dto, { id: user.id, name: user.name });
  }

  @Post(':id/receive')
  receive(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseDto,
  ) {
    return this.purchases.receive(id, dto, { id: user.id, name: user.name });
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.purchases.cancel(id, { id: user.id, name: user.name });
  }
}
