import { Injectable } from '@nestjs/common';
import type { AuditLog, Prisma } from '@prisma/client';
import { pageOf } from '../common/pagination';
import type { Page } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

export type AuditActor = { id: string; name: string };

export type AuditEntry = {
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  changes?: Array<{ field: string; before: unknown; after: unknown }>;
  actor: AuditActor;
};

// Diff superficial para `changes`: solo escalares comparables.
export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Array<{ field: string; before: unknown; after: unknown }> {
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];
  for (const field of new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])) {
    const b = before[field];
    const a = after[field];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes.push({ field, before: b ?? null, after: a ?? null });
    }
  }
  return changes;
}

// Append-only: este servicio solo CREA y LEE. Ningún servicio hace
// update/delete de audit_logs (los logs no se editan desde la API).
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<AuditLog> {
    // Round-trip JSON: convierte instancias de clase en POJOs planos
    // (snapshots estables) y satisface `InputJsonValue` de Prisma.
    const toJson = (value: unknown): Prisma.InputJsonValue | undefined =>
      value === undefined
        ? undefined
        : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);
    const db = tx ?? this.prisma;
    return db.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel,
        action: entry.action,
        summary: entry.summary,
        before: toJson(entry.before),
        after: toJson(entry.after),
        changes: toJson(entry.changes),
        createdBy: entry.actor.id,
        createdByName: entry.actor.name,
      },
    });
  }

  async list(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    search?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<Page<AuditLog>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.actorId && { createdBy: filters.actorId }),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
      ...(filters.search && {
        OR: [
          { entityLabel: { contains: filters.search, mode: 'insensitive' } },
          { summary: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return pageOf(data, total, page, limit);
  }
}
