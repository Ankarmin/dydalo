import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@prisma/client';
import { AUTH_COOKIE_NAME } from '../auth.constants';

// Lee el JWT desde la cookie httpOnly (NO desde `Authorization: Bearer`:
// el browser la envía solo al dominio propio, mitigando XSS frente a
// localStorage). Falla cerrado: sin cookie o firma inválida → 401.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      cookies?: Record<string, string>;

      user?: any;
    }>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('No autenticado');
    }
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: UserRole;
        name: string;
      }>(token, { secret: this.config.getOrThrow<string>('JWT_SECRET') });
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
