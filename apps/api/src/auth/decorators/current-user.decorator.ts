import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';

// Usuario autenticado que los guards cuelgan en `request.user`.
// Solo id + rol + email + nombre display: nunca el hash ni datos sensibles.
// El `name` viaja en el JWT para no consultar la DB en cada request
// (lo usa la auditoría como `createdByName`).
export type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user) {
      throw new UnauthorizedException('No autenticado');
    }
    return request.user;
  },
);
