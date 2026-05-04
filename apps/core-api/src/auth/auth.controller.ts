/**
 * Auth controller: register, login, refresh, Google OAuth, profile.
 *
 * Routes:
 *  POST /auth/register     — public, tạo tài khoản email/password.
 *  POST /auth/login        — public, đăng nhập email/password.
 *  POST /auth/refresh      — public, đổi refresh token lấy cặp mới.
 *  GET  /auth/google       — public, redirect sang Google consent.
 *  GET  /auth/google/callback — public, Google gọi lại, redirect frontend với token.
 *  GET  /auth/me           — protected, thông tin user hiện tại.
 */
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { AuthService, type GoogleProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Email / Password
  // ---------------------------------------------------------------------------

  @Public()
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.name, dto.email, dto.password);
  }

  @Public()
  @ApiOperation({ summary: 'Đăng nhập email/password, nhận token pair' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  @Public()
  @ApiOperation({ summary: 'Đổi refresh token lấy cặp access + refresh mới' })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  // ---------------------------------------------------------------------------
  // Google OAuth
  // ---------------------------------------------------------------------------

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect sang Google consent screen' })
  @Get('google')
  google() {
    // Guard sẽ redirect — method body không chạy.
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google callback — issue tokens, redirect frontend' })
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile;
    const tokens = await this.auth.googleLogin(profile);

    // Redirect frontend với tokens qua query params.
    // Cách production hơn: set httpOnly cookie, nhưng query string đơn giản cho dev.
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  // ---------------------------------------------------------------------------
  // Protected
  // ---------------------------------------------------------------------------

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Thông tin user hiện tại (JWT)' })
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.getProfile(user.userId);
  }
}
