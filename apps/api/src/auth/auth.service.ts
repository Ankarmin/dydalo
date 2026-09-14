import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { UsersRepository } from '../users/users.repository';
import type { PublicUser } from '../users/users.repository';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  BCRYPT_ROUNDS,
} from './auth.constants';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function displayNameOf(
  user: Pick<PublicUser, 'firstName' | 'lastName' | 'email'>,
): string {
  const full = [user.firstName, user.lastName]
    .filter((p): p is string => !!p)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');
  return full || user.email;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      // En prod el frontend y la API comparten esquema https tras deploy;
      // Lax bloquea CSRF de terceros manteniendo navegación propia.
      sameSite: 'lax' as const,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    };
  }

  setAuthCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE_NAME, token, this.cookieOptions());
  }

  clearAuthCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, { ...this.cookieOptions(), maxAge: 0 });
  }

  signToken(
    user: Pick<PublicUser, 'id' | 'email' | 'role' | 'firstName' | 'lastName'>,
  ): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: displayNameOf(user),
    });
  }

  // Registro público: siempre rol customer. Los admin solo los crea el
  // seed o (Fase 4+) otro admin; nunca hay auto-promoción.
  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = normalizeEmail(dto.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }
    return this.users.create({
      email,
      role: 'customer',
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
  }

  async validateCredentials(dto: LoginDto): Promise<PublicUser> {
    const user = await this.users.findByEmailWithHash(
      normalizeEmail(dto.email),
    );
    // Mismo error exista o no: no filtrar qué emails están registrados.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    await this.users.touchLogin(user.id);
    // Proyección explícita: el hash jamás sale del servicio.
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }
    return user;
  }
}
