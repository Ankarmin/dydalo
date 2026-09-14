import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Uso: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`.
// Sin `@Roles`, RolesGuard deja pasar (solo exige sesión si se combina
// con JwtAuthGuard).
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
