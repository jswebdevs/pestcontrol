import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { Public } from '../../common/decorators/public.decorator';
import { MailService } from '../mail/mail.service';

class ContactDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() subject?: string;
  @IsString() @IsNotEmpty() message!: string;
  @IsOptional() @IsString() relatedOrderCode?: string;
}

@Injectable()
class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async submit(body: ContactDto) {
    const message = await this.prisma.contactMessage.create({ data: body });
    await this.mail.notifyAdmin('contact-form-submission', body);
    return { id: message.id };
  }

  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  }

  markRead(id: string) {
    return this.prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  }
}

@Controller({ path: 'contact', version: '1' })
class PublicContactController {
  constructor(private readonly svc: ContactService) {}

  @Public()
  @Post()
  submit(@Body() body: ContactDto) {
    return this.svc.submit(body);
  }
}

@Controller({ path: 'admin/contact-messages', version: '1' })
@UseGuards(JwtAdminGuard)
class AdminContactController {
  constructor(private readonly svc: ContactService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }
}

@Module({
  providers: [ContactService],
  controllers: [PublicContactController, AdminContactController],
})
export class ContactModule {}
