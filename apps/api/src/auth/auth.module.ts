import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    // Global: los guards (JwtAuthGuard) se instancian en el módulo de cada
    // controller que los usa (users, addresses…), no solo en AuthModule.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Formato garantizado por env.validation.ts (`7d`, `12h`…).
        const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as
          number | `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
