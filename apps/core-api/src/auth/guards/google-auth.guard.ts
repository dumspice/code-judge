/**
 * Guard cho Google OAuth flow — kích hoạt Passport `google` strategy.
 * Dùng trên GET /auth/google (redirect) và GET /auth/google/callback.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
