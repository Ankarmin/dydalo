import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  // Valida todos los DTOs entrantes (security-validate-all-input).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // CORS: solo la(s) web declarada(s), con credenciales (cookies JWT).
  // FRONTEND_URLS admite coma-separado para previews/staging.
  const origins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    ...(process.env.FRONTEND_URLS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ];
  app.enableCors({ origin: origins, credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
