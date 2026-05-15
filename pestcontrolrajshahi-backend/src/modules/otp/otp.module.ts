import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
