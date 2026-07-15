import { Controller, Get, Post, Query, UseGuards, Res, Header } from '@nestjs/common';
import { GoogleReviewsService } from './google-reviews.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Response } from 'express';

@Controller('google-reviews')
export class GoogleReviewsController {
  constructor(private readonly googleReviewsService: GoogleReviewsService) {}

  // Endpoint para sincronizar reseñas (requiere API Key)
  @Post('sync')
  @UseGuards(AuthGuard)
  async syncReviews() {
    const result = await this.googleReviewsService.syncGoogleReviews();
    return {
      success: true,
      message: 'Google Reviews sync completed',
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  // Endpoint para obtener reseñas (requiere API Key)
  @Get('reviews')
  @UseGuards(AuthGuard)
  async getReviews(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.googleReviewsService.getReviews(limitNum, offsetNum);
  }

  // Endpoint para obtener información del lugar (requiere API Key)
  @Get('place-info')
  @UseGuards(AuthGuard)
  async getPlaceInfo() {
    return this.googleReviewsService.getPlaceInfo();
  }

  // Endpoint para obtener estadísticas de reseñas (requiere API Key)
  @Get('stats')
  @UseGuards(AuthGuard)
  async getStats() {
    return this.googleReviewsService.getReviewStats();
  }

  // ============================================
  // ENDPOINTS PÚBLICOS PARA cabsdgo.com
  // ============================================

  // Endpoint público para obtener reseñas
  @Get('public/reviews')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicReviews(@Res() res: Response, @Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const result = await this.googleReviewsService.getReviews(limitNum, 0);
      return res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching reviews',
        error: errorMessage,
      });
    }
  }

  // Endpoint público para obtener información del lugar
  @Get('public/place-info')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicPlaceInfo(@Res() res: Response) {
    try {
      const data = await this.googleReviewsService.getPlaceInfo();
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching place info',
        error: errorMessage,
      });
    }
  }

  // Endpoint público para obtener estadísticas
  @Get('public/stats')
  @Header('Access-Control-Allow-Origin', 'https://cabsdgo.com')
  async getPublicStats(@Res() res: Response) {
    try {
      const data = await this.googleReviewsService.getReviewStats();
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error fetching stats',
        error: errorMessage,
      });
    }
  }
}