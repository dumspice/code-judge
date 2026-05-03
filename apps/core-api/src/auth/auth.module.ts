/**
 * Auth: JWT (Passport `jwt` strategy) + guard toàn cục.
 *
 * - `JwtAuthGuard`: mọi route mặc định cần `Authorization: Bearer`, trừ khi có `@Public()`.
 * - `RolesGuard`: nếu dùng `@Roles(...)`, user phải có một trong các role đó (sau khi JWT hợp lệ).
 *
 * Export `AuthService` / `JwtModule` để module khác (ví dụ user) tái sử dụng ký token.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvKeys } from '../common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>(EnvKeys.JWT_SECRET);
        if (!secret) {
          throw new Error(`${EnvKeys.JWT_SECRET} is required`);
        }
        const expiresRaw = config.get<string>(EnvKeys.JWT_EXPIRES_IN);
        /** Số giây; mặc định 7 ngày. Có thể set `JWT_EXPIRES_IN=3600`. */
        const expiresIn = expiresRaw !== undefined && expiresRaw !== '' ? Number(expiresRaw) : 604800;
        if (Number.isNaN(expiresIn) || expiresIn <= 0) {
          throw new Error(`${EnvKeys.JWT_EXPIRES_IN} must be a positive number (seconds)`);
        }
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
