import type { Role } from '@prisma/client';

/** Claims trong JWT (chuẩn `sub` = subject = id user trong DB). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
