import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListAdminReturnsDto } from './dto/list-admin-returns.dto';
import {
  AdminCreateReturnDto,
  CloseReturnDto,
  InspectReturnDto,
  ReceiveReturnDto,
  SetReturnStatusDto,
} from './dto/return.dto';
import { ReturnsService } from './returns.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  list(@Query() dto: ListAdminReturnsDto) {
    return this.returns.listAdmin(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.returns.getAdminOrFail(id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: AdminCreateReturnDto) {
    return this.returns.create({
      ...dto,
      origin: 'admin',
      actor: { id: user.id, name: user.name },
    });
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetReturnStatusDto,
  ) {
    return this.returns.setStatus(id, dto, { id: user.id, name: user.name });
  }

  @Post(':id/receive')
  receive(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReceiveReturnDto,
  ) {
    return this.returns.receive(id, dto, { id: user.id, name: user.name });
  }

  @Post(':id/inspect')
  inspect(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: InspectReturnDto,
  ) {
    return this.returns.inspect(id, dto, { id: user.id, name: user.name });
  }

  @Post(':id/close')
  close(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CloseReturnDto,
  ) {
    return this.returns.close(id, dto, { id: user.id, name: user.name });
  }
}
