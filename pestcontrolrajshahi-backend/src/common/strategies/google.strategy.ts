import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('google.clientId') || 'placeholder',
      clientSecret: config.get<string>('google.clientSecret') || 'placeholder',
      callbackURL: config.get<string>('google.callbackUrl') || 'http://localhost:4001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value;
    done(null, {
      providerUserId: profile.id,
      email,
      name: profile.displayName,
      avatar,
    });
  }
}
