import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { AdminInvitesController, PublicInvitesController } from './invites.controller';

@Module({
  providers: [InvitesService],
  controllers: [AdminInvitesController, PublicInvitesController],
})
export class InvitesModule {}
