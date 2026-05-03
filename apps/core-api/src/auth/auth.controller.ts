/**
 * HTTP auth: login công khai, `me` yêu cầu JWT. Response thực tế vẫn qua interceptor → envelope.
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Route công khai: cấp JWT khi tìm thấy user theo email (mật khẩu sẽ bổ sung sau). */
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.loginByEmail(dto.email);
  }

  /** Cần header `Authorization: Bearer <token>`. */
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.getProfile(user.userId);
  }
}
