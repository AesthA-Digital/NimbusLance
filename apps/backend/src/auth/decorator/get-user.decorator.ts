import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../types/auth.types';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: UserPayload }>();
    return request.user; // comes from validate() in JwtStrategy
  },
);
