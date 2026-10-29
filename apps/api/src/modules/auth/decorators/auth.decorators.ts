import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '@sports/shared';

export const IS_PUBLIC_KEY = 'IS_PUBLIC';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'ROLES';
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'PERMISSIONS';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  if (!user) return null;
  if (!data) return user;
  if (data === 'sub' || data === 'id' || data === '_id') {
    return user.id || user._id?.toString();
  }
  if (data === 'name') {
    return user.fullName || user.name || 'Người dùng';
  }
  if (data === 'role') {
    return user.role;
  }
  return (user as any)[data as string] ?? user;
});
