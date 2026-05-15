import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtCustomerStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  constructor(config: ConfigService) {
    const cookiePrefix = config.get<string>('cookiePrefix') || 'app';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.[`${cookiePrefix}_customer_access`] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  validate(payload: any): JwtUser {
    if (payload.scope !== 'CUSTOMER') {
      throw new Error('Wrong scope');
    }
    return { ...payload, sub: payload.sub };
  }
}
