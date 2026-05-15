import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';
import { OtpService } from './otp.service';
import { Public } from '../../common/decorators/public.decorator';

const PURPOSES = ['register', 'login', 'order', 'phone-change', 'reset'] as const;

class SendOtpDto {
  @IsString() @IsNotEmpty() phone!: string;
  @IsIn(PURPOSES as unknown as string[]) purpose!: (typeof PURPOSES)[number];
}

class VerifyOtpDto {
  @IsString() @IsNotEmpty() phone!: string;
  @IsIn(PURPOSES as unknown as string[]) purpose!: (typeof PURPOSES)[number];
  @IsString() @Length(6, 6) code!: string;
}

@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Public()
  @Post('send')
  send(@Body() body: SendOtpDto) {
    return this.otp.send(body.phone, body.purpose);
  }

  @Public()
  @Post('verify')
  verify(@Body() body: VerifyOtpDto) {
    return this.otp.verify(body.phone, body.purpose, body.code);
  }
}
