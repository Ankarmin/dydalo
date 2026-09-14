import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditActor } from '../../audit/audit.service';
import { AuditService, diffObjects } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

// El frontend lo lee para textos, FAQ, hero y modo mantenimiento.
// Sin UI admin por decisión B-05 (David lo mantiene), pero el PATCH
// queda para operativo/futuro. Merge superficial por clave top-level.
@Injectable()
export class SiteConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async getOrFail() {
    const config = await this.prisma.siteConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) {
      throw new NotFoundException(
        'Configuración no inicializada (corre el seed)',
      );
    }
    return config;
  }

  getPublic() {
    return this.getOrFail();
  }

  async update(patch: object, actor: AuditActor) {
    const before = await this.getOrFail();
    const input = patch as Record<string, unknown>;
    const keys = Object.keys(input).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('Nada que actualizar');
    }
    const data: Prisma.SiteConfigUpdateInput = { updatedBy: actor.id };
    for (const key of keys) {
      (data as Record<string, unknown>)[key] = input[key];
    }
    const after = await this.prisma.siteConfig.update({
      where: { id: 'default' },
      data,
    });
    await this.audit.log({
      entityType: 'site_config',
      entityId: 'default',
      entityLabel: 'Configuración del sitio',
      action: 'update',
      summary: `Configuración actualizada: ${keys.join(', ')}`,
      before,
      after,
      changes: diffObjects(before, after),
      actor,
    });
    return after;
  }
}
