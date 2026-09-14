import { Injectable } from '@nestjs/common';
import type { Prisma, Supplier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    return this.prisma.supplier.create({ data });
  }

  update(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier> {
    return this.prisma.supplier.update({ where: { id }, data });
  }
}
