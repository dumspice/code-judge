/**
 * Nghiệp vụ đăng nhập & cấp JWT. Payload token gồm `sub` (user id), `email`, `role` (Prisma).
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Đăng nhập theo email. Khi có `passwordHash` trên User, bổ sung so sánh bcrypt tại đây.
   */
  async loginByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      tokenType: 'Bearer' as const,
    };
  }

  /** Lấy bản ghi User đầy đủ từ DB (khác với `RequestUser` chỉ có các field trong JWT). */
  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return user;
  }

  /** Ký access token bất đồng bộ (dùng secret / expiresIn từ `AuthModule`). */
  private signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload);
  }
}
