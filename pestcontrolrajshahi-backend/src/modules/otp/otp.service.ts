import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

type Purpose = 'register' | 'login' | 'order' | 'phone-change' | 'reset';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private store = new Map<string, OtpEntry>();
  private rateLimit = new Map<string, number[]>();

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private rateKey(phone: string) {
    return `rate:${phone}`;
  }

  private cacheKey(purpose: Purpose, phone: string) {
    return `otp:${purpose}:${phone}`;
  }

  private assertRateLimit(phone: string) {
    const now = Date.now();
    const key = this.rateKey(phone);
    const timestamps = (this.rateLimit.get(key) ?? []).filter((t) => now - t < 60 * 60 * 1000);
    if (timestamps.length >= 5) {
      throw new BadRequestException('Too many OTP requests for this phone. Try later.');
    }
    if (timestamps.length > 0 && now - timestamps[timestamps.length - 1] < 60 * 1000) {
      throw new BadRequestException('Please wait a minute before requesting another OTP.');
    }
    timestamps.push(now);
    this.rateLimit.set(key, timestamps);
  }

  async send(phone: string, purpose: Purpose): Promise<{ sent: boolean }> {
    this.assertRateLimit(phone);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.store.set(this.cacheKey(purpose, phone), {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    const apiKey = this.config.get<string>('sms.apiKey');
    const senderId = this.config.get<string>('sms.senderId');
    const appName = this.config.get<string>('appName');
    if (!apiKey || apiKey.startsWith('replace_')) {
      this.logger.log(`[OTP dry-run] phone=${phone} purpose=${purpose} code=${code}`);
      return { sent: true };
    }
    try {
      await axios.get('http://bulksmsbd.net/api/smsapi', {
        params: {
          api_key: apiKey,
          type: 'text',
          number: phone,
          senderid: senderId,
          message: `Your ${appName} code: ${code}. Valid 5 minutes. Do not share.`,
        },
        timeout: 8000,
      });
    } catch (err) {
      this.logger.error(`SMS send failed: ${(err as Error).message}`);
    }
    return { sent: true };
  }

  async verify(phone: string, purpose: Purpose, code: string): Promise<{ otpToken: string }> {
    const entry = this.store.get(this.cacheKey(purpose, phone));
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    this.store.delete(this.cacheKey(purpose, phone));
    const otpToken = this.jwt.sign(
      { phone, purpose },
      {
        secret: this.config.get<string>('jwt.otpSecret')!,
        expiresIn: '10m',
      },
    );
    return { otpToken };
  }

  /** Consume an otpToken, returning phone+purpose if valid. Throws otherwise. */
  consume(otpToken: string, expectedPurpose: Purpose): { phone: string } {
    try {
      const decoded = this.jwt.verify<{ phone: string; purpose: Purpose }>(otpToken, {
        secret: this.config.get<string>('jwt.otpSecret')!,
      });
      if (decoded.purpose !== expectedPurpose) {
        throw new BadRequestException('OTP token purpose mismatch');
      }
      return { phone: decoded.phone };
    } catch {
      throw new BadRequestException('Invalid or expired OTP token');
    }
  }
}
