/**
 * Auth service: register, login (email/password), Google OAuth, token pair (access + refresh).
 *
 * Flow:
 *  1. Register → hash password → create user → issue token pair.
 *  2. Login → verify password → issue token pair.
 *  3. Refresh → verify refresh token → rotate (revoke old, issue new pair).
 *  4. Google OAuth → find-or-create user + OAuthAccount → issue token pair.
 */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EnvKeys, hashPassword, verifyPassword } from '../common';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

/** Shape returned by Google Passport strategy → `request.user`. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  image: string | null;
}

/** Token pair returned to the client. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  /** Refresh token secret (separate from access token secret). */
  private readonly refreshSecret: string;
  /** Refresh token expiry in seconds. Default: 7 days. */
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshSecret =
      this.config.get<string>(EnvKeys.JWT_REFRESH_SECRET) ??
      this.config.get<string>(EnvKeys.JWT_SECRET)! + '-refresh';

    const rawExpiry = this.config.get<string>(EnvKeys.JWT_REFRESH_EXPIRES_IN);
    this.refreshExpiresIn =
      rawExpiry && !Number.isNaN(Number(rawExpiry)) ? Number(rawExpiry) : 604800;
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  async register(name: string, email: string, password: string): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await hashPassword(password);
    const id = randomBytes(12).toString('hex');

    const user = await this.prisma.user.create({
      data: { id, name, email, passwordHash },
    });

    return this.issueTokenPair(user);
  }

  // ---------------------------------------------------------------------------
  // Login (email + password)
  // ---------------------------------------------------------------------------

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user);
  }

  // ---------------------------------------------------------------------------
  // Refresh token
  // ---------------------------------------------------------------------------

  async refresh(refreshToken: string): Promise<TokenPair> {
    // 1. Verify JWT signature + expiry
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // 2. Find all non-revoked tokens for this user
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revoked: false },
    });

    // 3. Find matching token by comparing hashes
    let matchedTokenId: string | null = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.tokenHash);
      if (isMatch) {
        matchedTokenId = stored.id;
        break;
      }
    }

    if (!matchedTokenId) {
      // Possible replay attack — revoke ALL tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    // 4. Revoke the used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedTokenId },
      data: { revoked: true },
    });

    // 5. Load user and issue new pair
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khoá');
    }

    return this.issueTokenPair(user);
  }

  // ---------------------------------------------------------------------------
  // Google OAuth — find or create
  // ---------------------------------------------------------------------------

  async googleLogin(profile: GoogleProfile): Promise<TokenPair> {
    const { googleId, email, name, image } = profile;

    // Check if OAuth link exists
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'google', providerUserId: googleId } },
      include: { user: true },
    });

    if (oauthAccount) {
      // Existing user — update last login
      await this.prisma.user.update({
        where: { id: oauthAccount.userId },
        data: { lastLoginAt: new Date() },
      });
      return this.issueTokenPair(oauthAccount.user);
    }

    // Check if email already used (email/password user linking Google)
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link Google to existing user
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerUserId: googleId,
        },
      });
    } else {
      // Create new user + OAuth link
      const id = randomBytes(12).toString('hex');
      user = await this.prisma.user.create({
        data: {
          id,
          name,
          email,
          image,
          emailVerified: true, // Google email is verified
          oauthAccounts: {
            create: { provider: 'google', providerUserId: googleId },
          },
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /** Issue access + refresh token pair. Stores refresh token hash in DB. */
  private async issueTokenPair(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    ]);

    // Store hashed refresh token in DB
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshExpiresIn * 1000),
      },
    });

    // Cleanup: remove expired/revoked tokens (fire & forget)
    this.prisma.refreshToken
      .deleteMany({
        where: {
          userId: user.id,
          OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
        },
      })
      .catch(() => {
        /* best effort cleanup */
      });

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}
