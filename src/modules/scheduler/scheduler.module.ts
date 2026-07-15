import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { WebScrapingModule } from '../web-scraping/web-scraping.module';

@Module({
  imports: [
    GoogleMapsModule,   
    WebScrapingModule,  
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}