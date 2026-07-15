import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { WebScrapingService } from '../web-scraping/web-scraping.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private googleMapsService: GoogleMapsService,
    private webScrapingService: WebScrapingService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySync() {
    this.logger.log('Running daily sync...');
    
    try {
      await this.googleMapsService.syncGoogleMapsData();
      await this.webScrapingService.syncWebScrapingData();
      this.logger.log('Daily sync completed successfully');
    } catch (error) {
      this.logger.error(`Daily sync failed: ${error.message}`);
    }
  }

  // Ejecutar al iniciar (para pruebas)
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleInitialSync() {
    this.logger.log('Running initial sync...');
    try {
      await this.googleMapsService.syncGoogleMapsData();
      await this.webScrapingService.syncWebScrapingData();
      this.logger.log('Initial sync completed');
    } catch (error) {
      this.logger.error(`Initial sync failed: ${error.message}`);
    }
  }
}