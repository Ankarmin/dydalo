import { Injectable } from '@nestjs/common';
import type { Address } from '@prisma/client';
import { AddressesRepository } from './addresses.repository';
import type { CreateAddressDto } from './dto/create-address.dto';
import type { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly addresses: AddressesRepository) {}

  list(userId: string): Promise<Address[]> {
    return this.addresses.findByUser(userId);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const created = await this.addresses.create(userId, {
      label: dto.label.trim(),
      fullName: dto.fullName.trim(),
      street: dto.street.trim(),
      district: dto.district.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      zip: dto.zip?.trim(),
      country: dto.country?.trim() || 'Perú',
      phone: dto.phone,
      isDefault: false,
    });
    // Primera dirección, o marcada default: promover en transacción.
    const total = await this.addresses.countByUser(userId);
    if (dto.isDefault === true || total <= 1) {
      return this.addresses.setDefault(userId, created.id);
    }
    return created;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const { isDefault, ...fields } = dto;
    if (Object.keys(fields).length > 0) {
      await this.addresses.update(userId, id, fields);
    }
    if (isDefault === true) {
      return this.addresses.setDefault(userId, id);
    }
    return this.addresses.requireOne(userId, id);
  }

  setDefault(userId: string, id: string): Promise<Address> {
    return this.addresses.setDefault(userId, id);
  }

  remove(userId: string, id: string): Promise<void> {
    return this.addresses.delete(userId, id);
  }
}
