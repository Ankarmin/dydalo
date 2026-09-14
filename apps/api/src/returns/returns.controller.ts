import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReturnDto } from './dto/return.dto';
import { ReturnsService } from './returns.service';

// Mis devoluciones (cliente): solicitar dentro del SLA de 7 días
// y ver el estado de mis solicitudes.
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReturnDto) {
    return this.returns.create({
      ...dto,
      userId: user.id,
      origin: 'web',
      actor: { id: user.id, name: user.name },
    });
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.returns.listMine(user.id);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.returns.getMineOrFail(user.id, id);
  }
}
