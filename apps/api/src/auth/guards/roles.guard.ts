import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import type { RequestUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Autorización por rol (backlog §8: solo `admin`/`customer`).
// Debe combinarse con JwtAuthGuard: `@UseGuards(JwtAuthGuard, RolesGuard)`.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user) {
      throw new UnauthorizedException('No autenticado');
    }
    if (!required.includes(request.user.role)) {
      throw new ForbiddenException('Sin permiso para esta acción');
    }
    return true;
  }
}
