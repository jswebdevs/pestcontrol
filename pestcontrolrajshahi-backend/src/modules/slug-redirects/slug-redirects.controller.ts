import { Controller, Get, Param } from '@nestjs/common';
import { SlugRedirectsService } from './slug-redirects.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'slug-redirects', version: '1' })
export class SlugRedirectsController {
  constructor(private readonly svc: SlugRedirectsService) {}

  @Public()
  @Get(':type/:oldSlug')
  lookup(@Param('type') type: 'service' | 'project', @Param('oldSlug') oldSlug: string) {
    return this.svc.lookup(type, oldSlug);
  }
}
