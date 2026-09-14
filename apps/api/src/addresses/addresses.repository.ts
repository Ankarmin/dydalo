import { Injectable, NotFoundException } from '@nestjs/common';
import type { Address, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Todas las operaciones filtran por `userId`: un usuario jamás ve ni
// toca direcciones ajenas (la verificación vive aquí, no en el controller).
@Injectable()
export class AddressesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  findOneForUser(userId: string, id: string): Promise<Address | null> {
    return this.prisma.address.findFirst({ where: { id, userId } });
  }

  countByUser(userId: string): Promise<number> {
    return this.prisma.address.count({ where: { userId } });
  }

  create(userId: string, data: Prisma.AddressCreateWithoutUserInput) {
    return this.prisma.address.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }

  update(userId: string, id: string, data: Prisma.AddressUpdateInput) {
    return this.prisma.address.updateMany({ where: { id, userId }, data });
  }

  async requireOne(userId: string, id: string): Promise<Address> {
    const address = await this.findOneForUser(userId, id);
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }
    return address;
  }

  // Único default por usuario, en una sola transacción (db-use-transactions).
  async setDefault(userId: string, id: string): Promise<Address> {
    await this.requireOne(userId, id);
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
    return this.requireOne(userId, id);
  }

  async delete(userId: string, id: string): Promise<void> {
    const address = await this.requireOne(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: address.id } });
      // Si era la default y quedan otras, la más antigua hereda el rol.
      if (address.isDefault) {
        const oldest = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (oldest) {
          await tx.address.update({
            where: { id: oldest.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }
}
