import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { ROLES_KEY } from '../constants/auth.constants';

/** Yêu cầu một trong các role (kết hợp `RolesGuard`). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
