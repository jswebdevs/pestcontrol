import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlugRedirectsService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(resourceType: 'service' | 'project', oldSlug: string) {
    const r = await this.prisma.slugRedirect.findUnique({
      where: { resourceType_oldSlug: { resourceType, oldSlug } },
    });
    if (!r) throw new NotFoundException();
    return r;
  }

  async record(resourceType: 'service' | 'project', oldSlug: string, newSlug: string, resourceId: string) {
    if (oldSlug === newSlug) return;
    await this.prisma.slugRedirect.upsert({
      where: { resourceType_oldSlug: { resourceType, oldSlug } },
      update: { newSlug, resourceId },
      create: { resourceType, oldSlug, newSlug, resourceId },
    });
    // chase chain — if any rows pointed TO this newSlug previously, update them
    await this.prisma.slugRedirect.updateMany({
      where: { resourceType, newSlug: oldSlug, NOT: { oldSlug } },
      data: { newSlug },
    });
  }
}
