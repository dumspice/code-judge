import { IsEmail } from 'class-validator';

/** Body `POST /auth/login`. Mật khẩu sẽ bổ sung khi model User có hash. */
export class LoginDto {
  @IsEmail()
  email!: string;
}
