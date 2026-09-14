import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuditActor } from '../../audit/audit.service';
import { AuditService, diffObjects } from '../../audit/audit.service';
import { slugify } from '../../common/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublic() {
    return this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicOrFail(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || !post.published) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return post;
  }

  listAdmin() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'articulo';
    let slug = base;
    let n = 2;
    while (await this.prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  async create(dto: CreateBlogDto, actor: AuditActor) {
    const slug = await this.uniqueSlug(dto.title);
    const post = await this.prisma.blogPost.create({
      data: {
        title: dto.title.trim(),
        slug,
        excerpt: dto.excerpt.trim(),
        content: dto.content,
        coverImage: dto.coverImage,
        authorId: actor.id,
        authorName: dto.authorName?.trim() || actor.name,
        published: false,
      },
    });
    await this.audit.log({
      entityType: 'blog',
      entityId: post.id,
      entityLabel: post.title,
      action: 'create',
      summary: `Artículo creado: ${post.title}`,
      after: post,
      actor,
    });
    return post;
  }

  async update(id: string, dto: UpdateBlogDto, actor: AuditActor) {
    const before = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Artículo no encontrado');
    }
    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt.trim() }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.authorName !== undefined && {
          authorName: dto.authorName.trim(),
        }),
      },
    });
    await this.audit.log({
      entityType: 'blog',
      entityId: post.id,
      entityLabel: post.title,
      action: 'update',
      summary: `Artículo editado: ${post.title}`,
      before,
      after: post,
      changes: diffObjects(before, post),
      actor,
    });
    return post;
  }

  async setPublished(id: string, published: boolean, actor: AuditActor) {
    const before = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Artículo no encontrado');
    }
    if (before.published === published) return before;
    const post = await this.prisma.blogPost.update({
      where: { id },
      data: { published },
    });
    await this.audit.log({
      entityType: 'blog',
      entityId: post.id,
      entityLabel: post.title,
      action: published ? 'activate' : 'deactivate',
      summary: published
        ? `Artículo publicado: ${post.title}`
        : `Artículo despublicado: ${post.title}`,
      before,
      after: post,
      actor,
    });
    return post;
  }

  async remove(id: string, actor: AuditActor) {
    const before = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Artículo no encontrado');
    }
    if (before.published) {
      throw new ConflictException('Despublica el artículo antes de eliminarlo');
    }
    await this.prisma.blogPost.delete({ where: { id } });
    await this.audit.log({
      entityType: 'blog',
      entityId: id,
      entityLabel: before.title,
      action: 'delete',
      summary: `Artículo eliminado: ${before.title}`,
      before,
      actor,
    });
    return { success: true as const };
  }
}
