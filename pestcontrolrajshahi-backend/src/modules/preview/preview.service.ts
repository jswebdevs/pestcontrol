import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RichContentService } from '../rich-content/rich-content.service';

@Injectable()
export class PreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rich: RichContentService,
  ) {}

  async mint(userId: string, resourceType: 'service' | 'project', resourceId: string) {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.previewToken.create({
      data: { token, userId, resourceType, resourceId, expiresAt },
    });
    return { token, expiresAt };
  }

  async resolve(token: string) {
    const t = await this.prisma.previewToken.findUnique({ where: { token } });
    if (!t || t.expiresAt < new Date()) throw new NotFoundException('Preview token expired');
    if (t.resourceType === 'service') {
      const s = await this.prisma.service.findUnique({
        where: { id: t.resourceId },
        include: { category: true },
      });
      if (!s) throw new NotFoundException();
      return { type: 'service', payload: { ...s, longDescHtml: this.rich.toHtml(s.longDesc) } };
    }
    const p = await this.prisma.project.findUnique({ where: { id: t.resourceId } });
    if (!p) throw new NotFoundException();
    return { type: 'project', payload: { ...p, bodyHtml: this.rich.toHtml(p.body) } };
  }
}
