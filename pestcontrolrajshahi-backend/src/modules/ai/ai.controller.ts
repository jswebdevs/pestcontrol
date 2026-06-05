import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Controller({ path: 'admin/ai', version: '1' })
@UseGuards(JwtAdminGuard)
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly gemini: GeminiService,
  ) {}

  @Get('status')
  status() {
    return {
      ready: this.gemini.isReady(),
    };
  }

  @Post('home')
  home() {
    return this.ai.generateHome();
  }

  @Post('footer')
  footer() {
    return this.ai.generateFooter();
  }

  @Post('about')
  about() {
    return this.ai.generateAbout();
  }

  @Post('contact')
  contact() {
    return this.ai.generateContact();
  }

  @Post('faqs')
  faqs(@Body() body: { serviceNames?: string[] }) {
    return this.ai.generateFaqs(body?.serviceNames || []);
  }

  @Post('testimonials')
  testimonials(@Body() body: { serviceNames?: string[] }) {
    return this.ai.generateTestimonials(body?.serviceNames || []);
  }

  @Post('policy')
  policy(@Body() body: { kind: 'privacy' | 'refund' | 'terms' }) {
    return this.ai.generatePolicy(body.kind);
  }

  @Post('service')
  service(@Body() body: { name: string }) {
    return this.ai.generateService(body.name);
  }

  @Post('projects')
  projects(@Body() body: { serviceNames?: string[]; count?: number }) {
    return this.ai.generateProjects(body?.serviceNames || [], body?.count || 8);
  }

  @Post('image')
  async image(@Body() body: { prompt: string; alt?: string; folderTag?: string }) {
    return this.ai.generateAndUploadImage({
      prompt: body.prompt,
      alt: body.alt,
      folderTag: body.folderTag,
    });
  }

  @Post('apply')
  apply(@Body() body: any) {
    return this.ai.apply(body || {});
  }
}
