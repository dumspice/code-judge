/**
 * Chạy sau khi user đã qua JWT: so khớp `request.user.role` với `@Roles(...)`.
 * Không gắn `@Roles` → guard luôn cho qua (chỉ cần JWT nếu route không `@Public`).
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/constants/auth.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    const { user } = req;
    if (!user) {
      return false;
    }
    return required.includes(user.role);
  }
}
