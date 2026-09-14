import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Lo que la API expone de un usuario: nunca `passwordHash`
// (tampoco va a los logs de auditoría en Fases 5+).
export const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'role'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'emailVerified'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
>;

// Única capa que habla con `users`/`addresses` en Prisma.
// Los servicios (auth, users) usan este repositorio, no Prisma directo.
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  }

  findByEmailWithHash(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  findByIdWithHash(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<PublicUser> {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  }

  touchLogin(id: string): Promise<void> {
    return this.prisma.user
      .update({ where: { id }, data: { lastLoginAt: new Date() } })
      .then(() => undefined);
  }
}
