import { Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { WebScrapingService } from './web-scraping.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('web-scraping')
export class WebScrapingController {
  constructor(private readonly webScrapingService: WebScrapingService) {}

  @Get('data')
  @UseGuards(AuthGuard)
  async getWebScrapingData(@Query('url') url?: string) {
    return this.webScrapingService.getWebScrapingData(url);
  }

  @Post('sync')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncWebScrapingData() {
    await this.webScrapingService.syncWebScrapingData();
    return { 
      message: 'Web scraping data sync initiated successfully',
      timestamp: new Date().toISOString()
    };
  }

  // Endpoint para probar el scraper (con API Key)
  @Get('test-scrape')
  @UseGuards(AuthGuard)
  async testScrape(@Query('url') url?: string) {
    const targetUrl = url || 'https://www.nationalsoft.store/Producto/CatalogoHardware';
    const data = await this.webScrapingService.scrapeProductsDirectly(targetUrl);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }
}