import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/** Body `POST /auth/login`. Mật khẩu sẽ bổ sung khi model User có hash. */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}
