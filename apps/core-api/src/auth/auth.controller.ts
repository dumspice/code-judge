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
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { AuthService, type GoogleProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.register(dto.name, dto.email, dto.password);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, tokenType: tokens.tokenType };
  }

  @Public()
  @ApiOperation({ summary: 'Đăng nhập email/password, nhận token pair' })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.login(dto.email, dto.password);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, tokenType: tokens.tokenType };
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  @Public()
  @ApiOperation({ summary: 'Đổi refresh token lấy cặp access + refresh mới' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không tìm thấy trong cookie');
    }
    const tokens = await this.auth.refresh(refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, tokenType: tokens.tokenType };
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
    const profile = req.user as unknown as GoogleProfile;
    const tokens = await this.auth.googleLogin(profile);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất, xoá cookie' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }

  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.getUserProfile(user.userId);
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
