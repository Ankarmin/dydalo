import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuditActor } from '../audit/audit.service';
import { AuditService, diffObjects } from '../audit/audit.service';
import type { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SuppliersRepository } from './suppliers.repository';

// Sin borrado físico: las OC referencian al proveedor (Restrict).
// Dar de baja = `active: false`.
@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliers: SuppliersRepository,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.suppliers.list();
  }

  async create(dto: CreateSupplierDto, actor: AuditActor) {
    const supplier = await this.suppliers.create({
      name: dto.name.trim(),
      contact: dto.contact?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      active: true,
    });
    await this.audit.log({
      entityType: 'inventory',
      entityId: supplier.id,
      entityLabel: supplier.name,
      action: 'create',
      summary: `Registró proveedor ${supplier.name}`,
      after: supplier,
      actor,
    });
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, actor: AuditActor) {
    const before = await this.suppliers.findById(id);
    if (!before) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    const supplier = await this.suppliers.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.contact !== undefined && {
        contact: dto.contact?.trim() || null,
      }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      ...(dto.active !== undefined && { active: dto.active }),
    });
    await this.audit.log({
      entityType: 'inventory',
      entityId: id,
      entityLabel: supplier.name,
      action: 'update',
      summary: `Editó proveedor ${supplier.name}`,
      before,
      after: supplier,
      changes: diffObjects(before, supplier),
      actor,
    });
    return supplier;
  }
}
