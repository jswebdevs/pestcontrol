import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  sub: string;
  role: string;
  scope: 'ADMIN' | 'CUSTOMER';
  email?: string | null;
  phone?: string | null;
  name?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
