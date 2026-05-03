/**
 * Đọc Bearer token, verify chữ ký, gọi `validate` → gán `request.user` (`RequestUser`).
 * Tên strategy `'jwt'` khớp `AuthGuard('jwt')`.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvKeys } from '../../common';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>(EnvKeys.JWT_SECRET);
    if (!secret) {
      throw new Error(`${EnvKeys.JWT_SECRET} is required for JWT authentication`);
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /** Payload đã được verify; map `sub` → `userId` cho code rõ nghĩa. */
  validate(payload: JwtPayload): RequestUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
