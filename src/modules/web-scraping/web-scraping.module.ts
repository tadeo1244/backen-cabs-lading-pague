import { Module } from '@nestjs/common';
import { WebScrapingService } from './web-scraping.service';
import { WebScrapingController } from './web-scraping.controller';

@Module({
  providers: [WebScrapingService],
  controllers: [WebScrapingController],
  exports: [WebScrapingService],
})
export class WebScrapingModule {}