import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../auth/auth.constants';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { PublicUser } from './users.repository';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  getProfile(id: string): Promise<PublicUser | null> {
    return this.users.findById(id);
  }

  updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    return this.users.update(id, {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findByIdWithHash(id);
    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }
    const matches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    await this.users.update(id, {
      passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    });
  }
}
