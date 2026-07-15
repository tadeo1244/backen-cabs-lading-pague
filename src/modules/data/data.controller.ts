import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { DataService } from './data.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Response } from 'express'; // Cambiar a import type

@Controller('api')
export class DataController {
  constructor(private readonly dataService: DataService) { }

  // Endpoints protegidos con API Key
  @Get('data')
  @UseGuards(AuthGuard)
  async getAllData() {
    return this.dataService.getAllData();
  }

  @Get('data/google-maps')
  @UseGuards(AuthGuard)
  async getGoogleMapsData() {
    return this.dataService.getGoogleMapsData();
  }

  @Get('data/web-scraping')
  @UseGuards(AuthGuard)
  async getWebScrapingData(@Query('url') url?: string) {
    return this.dataService.getWebScrapingData(url);
  }

  @Get('logs')
  @UseGuards(AuthGuard)
  async getSyncLogs(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.dataService.getSyncLogs(limitNumber);
  }

  // Endpoints públicos para cabsdgo.com
  @Get('public/data')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicData(@Res() res: Response) {
    try {
      const data = await this.dataService.getAllData();
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching data',
        error: errorMessage
      });
    }
  }

  @Get('public/google-maps')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicGoogleMaps(@Res() res: Response) {
    try {
      const data = await this.dataService.getGoogleMapsData();
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching Google Maps data',
        error: errorMessage
      });
    }
  }

  @Get('public/web-scraping')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicWebScraping(@Query('url') url: string, @Res() res: Response) {
    try {
      const data = await this.dataService.getWebScrapingData(url);
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching Web Scraping data',
        error: errorMessage
      });
    }
  }

  @Get('public/products')
  async getPublicProducts(@Res() res: Response) {
    try {
      // Configurar CORS para permitir el origen específico
      const origin = res.req.headers.origin;
      const allowedOrigins = [
        'https://cabsdgo.com',
        'https://www.cabsdgo.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4321',
        'http://localhost:5173',
      ];

      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

      const scrapingData = await this.dataService.getWebScrapingData();

      if (!scrapingData || !Array.isArray(scrapingData)) {
        return res.json({
          success: true,
          total: 0,
          products: [],
          timestamp: new Date().toISOString()
        });
      }

      let allProducts: any[] = [];

      for (const item of scrapingData) {
        if (item && item.data && Array.isArray(item.data)) {
          allProducts = allProducts.concat(item.data);
        }
      }

      return res.json({
        success: true,
        total: allProducts.length,
        products: allProducts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching products',
        error: errorMessage
      });
    }
  }

  @Get('public/products/categories')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicCategories(@Res() res: Response) {
    try {
      const scrapingData = await this.dataService.getWebScrapingData();

      if (!scrapingData || !Array.isArray(scrapingData)) {
        return res.json({
          success: true,
          categories: [],
          totalCategories: 0,
          timestamp: new Date().toISOString()
        });
      }

      let allProducts: any[] = [];

      for (const item of scrapingData) {
        if (item && item.data && Array.isArray(item.data)) {
          allProducts = allProducts.concat(item.data);
        }
      }

      const categories = [...new Set(
        allProducts
          .map(p => p && p.categoria ? p.categoria : null)
          .filter((c): c is string => c !== null && c !== undefined)
      )];

      return res.json({
        success: true,
        categories,
        totalCategories: categories.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: errorMessage
      });
    }
  }
}