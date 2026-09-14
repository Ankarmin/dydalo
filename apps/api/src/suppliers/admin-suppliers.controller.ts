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
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/suppliers')
export class AdminSuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list() {
    return this.suppliers.list();
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSupplierDto) {
    return this.suppliers.create(dto, { id: user.id, name: user.name });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliers.update(id, dto, { id: user.id, name: user.name });
  }
}
