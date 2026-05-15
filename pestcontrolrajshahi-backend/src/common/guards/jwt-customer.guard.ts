import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtCustomerGuard extends AuthGuard('jwt-customer') {}
