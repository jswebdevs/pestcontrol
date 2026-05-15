import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Injectable()
class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const items = await this.prisma.setting.findMany();
    const out: Record<string, any> = {};
    for (const s of items) out[s.key] = s.value;
    return out;
  }

  async getOne(key: string) {
    const s = await this.prisma.setting.findUnique({ where: { key } });
    return s?.value ?? null;
  }

  async upsert(key: string, value: any) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

@Controller({ path: 'settings', version: '1' })
class PublicSettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Public()
  @Get()
  all() {
    return this.svc.getAll();
  }

  @Public()
  @Get(':key')
  one(@Param('key') key: string) {
    return this.svc.getOne(key);
  }
}

@Controller({ path: 'admin/settings', version: '1' })
@UseGuards(JwtAdminGuard)
class AdminSettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  all() {
    return this.svc.getAll();
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() body: { value: any }) {
    return this.svc.upsert(key, body.value);
  }
}

@Module({
  providers: [SettingsService],
  controllers: [AdminSettingsController, PublicSettingsController],
})
export class SettingsModule {}
