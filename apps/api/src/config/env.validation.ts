import { z } from 'zod';

// Validación de entorno al arrancar (devops-use-config-module).
// Falla rápido con mensaje claro si falta algo.
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es requerido'),
  // Formato `ms` (`7d`, `12h`…): lo exige el tipo `expiresIn` de @nestjs/jwt.
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(ms|s|m|h|d|w|y)$/, 'JWT_EXPIRES_IN inválido (ej. 7d)')
    .default('7d'),
  // Solo seed local (Fase 3). Nunca es la password real de nadie.
  ADMIN_SEED_PASSWORD: z.string().min(8).default('dydalo-local-dev'),
  // Web pública (CORS y back_urls de MP); coma-separado si hay varias.
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  FRONTEND_URLS: z.string().optional().default(''),
  // URL pública de ESTA api (notification_url del webhook MP).
  // En local MP no la alcanza: usar el simulador admin.
  API_PUBLIC_URL: z.string().default('http://localhost:3001'),
  // MercadoPago real (Fase 7). Sin token: preferencia en modo mock y
  // webhook/sync responden 503 (ver MpService).
  MP_ACCESS_TOKEN: z.string().optional().default(''),
  MP_WEBHOOK_SECRET: z.string().optional().default(''),
  // Las credenciales de prueba de MP también pueden venir como APP_USR-,
  // así que el prefijo TEST- no basta para detectar sandbox.
  MP_SANDBOX: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Variables de entorno inválidas: ${parsed.error.message}`);
  }
  // En prod, el placeholder de desarrollo no sirve como secreto.
  if (
    parsed.data.NODE_ENV === 'production' &&
    parsed.data.JWT_SECRET === 'change-me-in-local-env'
  ) {
    throw new Error(
      'JWT_SECRET usa el valor de ejemplo: defínelo antes de arrancar en producción',
    );
  }
  return parsed.data;
}
