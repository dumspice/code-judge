import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvKeys } from '../common';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    out[key] = decodeURIComponent(value);
  }
  return out;
}

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Resolve userId from HttpOnly accessToken cookie on the Socket handshake.
   */
  resolveUserIdFromHandshake(handshake: {
    headers?: { cookie?: string };
    auth?: { token?: string };
  }): string | null {
    const authToken = handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return this.verifyAccessToken(authToken);
    }

    const cookies = parseCookieHeader(handshake.headers?.cookie);
    const cookieToken = cookies.accessToken;
    if (!cookieToken) return null;

    return this.verifyAccessToken(cookieToken);
  }

  private verifyAccessToken(token: string): string | null {
    try {
      const secret = this.config.get<string>(EnvKeys.JWT_SECRET);
      if (!secret) return null;
      const payload = this.jwt.verify<JwtPayload>(token, { secret });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
