import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditActor } from '../../audit/audit.service';
import { AuditService } from '../../audit/audit.service';
import { CategoriesRepository } from './categories.repository';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly audit: AuditService,
  ) {}

  list(activeOnly: boolean) {
    return this.categories.list(activeOnly);
  }

  async getBySlugOrFail(slug: string) {
    const category = await this.categories.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async create(dto: CreateCategoryDto, actor: AuditActor) {
    const existing = await this.categories.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese slug');
    }
    const order = dto.order ?? (await this.nextOrder());
    const category = await this.categories.create({
      slug: dto.slug,
      name: dto.name.trim(),
      active: dto.active ?? true,
      order,
      description: dto.description?.trim(),
      image: dto.image?.trim() || undefined,
    });
    await this.audit.log({
      entityType: 'category',
      entityId: category.id,
      entityLabel: category.name,
      action: 'create',
      summary: `Categoría creada: ${category.name}`,
      after: category,
      actor,
    });
    return category;
  }

  private async nextOrder(): Promise<number> {
    const all = await this.categories.list(false);
    return all.reduce((max, c) => Math.max(max, c.order), -1) + 1;
  }

  async update(id: string, dto: UpdateCategoryDto, actor: AuditActor) {
    const before = await this.categories.findById(id);
    if (!before) {
      throw new NotFoundException('Categoría no encontrada');
    }
    const category = await this.categories.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.description !== undefined && {
        description: dto.description.trim() || null,
      }),
      ...(dto.image !== undefined && { image: dto.image.trim() || null }),
    });
    await this.audit.log({
      entityType: 'category',
      entityId: category.id,
      entityLabel: category.name,
      action: 'update',
      summary: `Categoría editada: ${category.name}`,
      before,
      after: category,
      actor,
    });
    return category;
  }

  async remove(id: string, actor: AuditActor) {
    const before = await this.categories.findById(id);
    if (!before) {
      throw new NotFoundException('Categoría no encontrada');
    }
    try {
      await this.categories.remove(id);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'No se puede eliminar: tiene productos asociados',
        );
      }
      throw e;
    }
    await this.audit.log({
      entityType: 'category',
      entityId: id,
      entityLabel: before.name,
      action: 'delete',
      summary: `Categoría eliminada: ${before.name}`,
      before,
      actor,
    });
    return { success: true as const };
  }

  async reorder(
    orders: Array<{ id: string; order: number }>,
    actor: AuditActor,
  ) {
    await this.categories.reorder(orders);
    await this.audit.log({
      entityType: 'category',
      entityId: 'all',
      entityLabel: 'Orden de categorías',
      action: 'update',
      summary: `Orden de categorías actualizado (${orders.length})`,
      after: orders,
      actor,
    });
    return this.categories.list(false);
  }
}
