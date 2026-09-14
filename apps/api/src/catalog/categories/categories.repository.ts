import { Injectable } from '@nestjs/common';
import type { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly: boolean): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }

  reorder(orders: Array<{ id: string; order: number }>): Promise<void> {
    return this.prisma
      .$transaction(
        orders.map((o) =>
          this.prisma.category.update({
            where: { id: o.id },
            data: { order: o.order },
          }),
        ),
      )
      .then(() => undefined);
  }
}
