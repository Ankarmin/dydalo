// Setup de e2e (ver `setupFiles` en jest-e2e.json): corre ANTES de
// importar los specs. ConfigModule valida al importarse AppModule, así
// que lo seteado AQUÍ llega a la validación; lo seteado dentro de un
// spec llega tarde (la validación ya corrió con el default).
// Solo test: el webhook real usa el secret del entorno desplegado.
process.env.MP_WEBHOOK_SECRET ??= 'e2e-webhook-secret';
