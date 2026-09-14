import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.addresses.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(user.id, id, dto);
  }

  @Post(':id/default')
  setDefault(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.addresses.setDefault(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.addresses.remove(user.id, id);
  }
}
