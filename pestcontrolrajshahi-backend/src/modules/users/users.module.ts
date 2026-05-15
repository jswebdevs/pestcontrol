import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import {
  UsersMeController,
  UsersEmailVerifyController,
  AdminUsersController,
} from './users.controller';

@Module({
  imports: [JwtModule.register({})],
  providers: [UsersService],
  controllers: [UsersMeController, UsersEmailVerifyController, AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
