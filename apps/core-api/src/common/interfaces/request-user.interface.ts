import type { Role } from '@prisma/client';

/** Payload gắn vào `request.user` sau khi JWT được xác thực. */
export interface RequestUser {
  userId: string;
  email: string;
  role: Role;
}
