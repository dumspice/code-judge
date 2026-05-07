/**
 * Auth controller: register, login, refresh, Google OAuth, me, logout.
 *
 * Routes:
 *  POST /auth/register        — public, tạo tài khoản email/password.
 *  POST /auth/login           — public, đăng nhập email/password.
 *  POST /auth/refresh         — public, đổi refresh token (cookie) lấy cặp mới.
 *  GET  /auth/google          — public, redirect sang Google consent.
 *  GET  /auth/google/callback — public, Google gọi lại, set cookie, redirect frontend.
 *  GET  /auth/me              — protected (JWT), trả thông tin user hiện tại.
 *  POST /auth/logout          — public, xoá cookie refreshToken.
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService, type GoogleProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { PrismaService } from '../prisma/prisma.service';

/** Cookie options shared across set/clear. */
const COOKIE_OPTS = (secure: boolean) =>
  ({
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  }) as const;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

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
  @ApiOperation({ summary: 'Đăng nhập email/password' })
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
  @ApiOperation({ summary: 'Đổi refresh token (cookie) lấy cặp access + refresh mới' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
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
  @ApiOperation({ summary: 'Google callback — set cookie, redirect frontend' })
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as unknown as GoogleProfile;

    const tokens = await this.auth.googleLogin(profile);

    // Set HttpOnly refresh token cookie
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    // NO accessToken in URL
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  // ---------------------------------------------------------------------------
  // Me (protected)
  // ---------------------------------------------------------------------------

  @ApiOperation({ summary: 'Trả thông tin user đang đăng nhập' })
  @Get('me')
  async me(@CurrentUser() requestUser: RequestUser) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: requestUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return user;
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất, xoá cookie refreshToken' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      ...COOKIE_OPTS(this.isProduction),
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTS(this.isProduction),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
