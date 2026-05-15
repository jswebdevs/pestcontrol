import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(config: ConfigService) {
    const cookiePrefix = config.get<string>('cookiePrefix') || 'app';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.[`${cookiePrefix}_admin_access`] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  validate(payload: any): JwtUser {
    if (payload.scope !== 'ADMIN') {
      throw new Error('Wrong scope');
    }
    return { ...payload, sub: payload.sub };
  }
}
