// Seed Fase 3: admins iniciales (Diego/David, `business-context.md`).
// Idempotente vía upsert: se puede correr en cada deploy sin duplicar.
// Password solo de seed local (`ADMIN_SEED_PASSWORD`, nunca real).
// El catálogo espejo del frontend llega en Fase 4.
// Contrato: `pnpm --filter api exec prisma db seed`.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedCatalog } from './seed-catalog';

const prisma = new PrismaClient();

const ADMINS = [
  {
    email: 'diego@dydalo.com',
    firstName: 'Diego Alessandro',
    lastName: 'Quiroz Fernandez',
  },
  {
    email: 'david@dydalo.com',
    firstName: 'David Sebastian',
    lastName: 'Pinarreta Rojas',
  },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_SEED_PASSWORD ?? 'dydalo-local-dev',
    12,
  );
  for (const admin of ADMINS) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: { role: 'admin' },
      create: { ...admin, role: 'admin', passwordHash },
      select: { email: true, role: true },
    });
    console.log(`Seed admin OK: ${user.email} (${user.role})`);
  }
  await seedCatalog(prisma);
}

void main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
