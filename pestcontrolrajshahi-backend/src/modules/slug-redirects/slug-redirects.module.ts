import { Global, Module } from '@nestjs/common';
import { SlugRedirectsService } from './slug-redirects.service';
import { SlugRedirectsController } from './slug-redirects.controller';

@Global()
@Module({
  providers: [SlugRedirectsService],
  controllers: [SlugRedirectsController],
  exports: [SlugRedirectsService],
})
export class SlugRedirectsModule {}
