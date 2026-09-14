import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdvanceShipmentDto } from './dto/shipment.dto';
import { ShipmentsService } from './shipments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders')
export class AdminShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get(':id/shipment')
  timeline(@Param('id') id: string) {
    return this.shipments.timeline(id);
  }

  @Post(':id/shipment')
  advance(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdvanceShipmentDto,
  ) {
    return this.shipments.advance(id, dto, { id: user.id, name: user.name });
  }
}
