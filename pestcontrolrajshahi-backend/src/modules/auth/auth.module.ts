import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAdminStrategy } from '../../common/strategies/jwt-admin.strategy';
import { JwtCustomerStrategy } from '../../common/strategies/jwt-customer.strategy';
import { GoogleStrategy } from '../../common/strategies/google.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [AuthService, JwtAdminStrategy, JwtCustomerStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
