// Setup de e2e (ver `setupFiles` en jest-e2e.json): corre ANTES de
// importar los specs. ConfigModule valida al importarse AppModule, así
// que lo seteado AQUÍ llega a la validación; lo seteado dentro de un
// spec llega tarde (la validación ya corrió con el default).
// Solo test: el webhook real usa el secret del entorno desplegado.
process.env.MP_WEBHOOK_SECRET ??= 'e2e-webhook-secret';
// Token FALSO (nunca sale a red: los tests que tocan MP mockean fetch).
// Existe para que `isConfigured()` sea true y cubrir las ramas con
// credenciales; el modo mock (sin token) se cubre en unit con stub.
process.env.MP_ACCESS_TOKEN ??= 'TEST-e2e-fake-token';
