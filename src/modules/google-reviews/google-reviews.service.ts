import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

export interface GoogleReview {
  id?: string;
  user: {
    name: string;
    thumbnail?: string;
  };
  rating: number;
  date: string;
  snippet: string;
  likes?: number;
}

export interface GoogleMapsResponse {
  place_info: {
    title: string;
    address: string;
    rating: number;
    reviews: number;
    type: string;
    phone?: string;
    website?: string;
  };
  reviews: GoogleReview[];
  serpapi_pagination?: {
    next_page_token?: string;
  };
}

@Injectable()
export class GoogleReviewsService {
  private readonly logger = new Logger(GoogleReviewsService.name);
  private readonly apiKey: string;
  private readonly dataId: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SERPAPI_API_KEY') || '';
    this.dataId = this.configService.get<string>('SERPAPI_DATA_ID') || '';
    
    if (!this.apiKey || !this.dataId) {
      this.logger.warn('SerpApi API Key or Data ID not configured');
    }
  }

  async syncGoogleReviews() {
    this.logger.log('Starting Google Reviews sync via SerpApi...');
    
    try {
      if (!this.apiKey || !this.dataId) {
        throw new Error('SerpApi configuration is missing');
      }

      const { reviews, placeInfo } = await this.fetchAllReviews();
      
      this.logger.log(`Fetched ${reviews.length} reviews from SerpApi`);

      // Guardar reseñas en la base de datos
      let savedCount = 0;
      for (const review of reviews) {
        try {
          const saved = await this.saveReview(review, this.dataId);
          if (saved) savedCount++;
        } catch (error) {
          this.logger.warn(`Error saving review: ${error.message}`);
        }
      }

      // Actualizar información del lugar
      await this.updatePlaceInfo(placeInfo);

      await this.logSync('google_reviews', 'success', undefined, savedCount);
      
      this.logger.log(`Synced ${savedCount} reviews successfully`);
      
      return {
        total: reviews.length,
        saved: savedCount,
        placeInfo,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error syncing Google reviews: ${errorMessage}`);
      await this.logSync('google_reviews', 'error', undefined, 0, errorMessage);
      throw error;
    }
  }

  private async fetchAllReviews(): Promise<{ reviews: GoogleReview[]; placeInfo: any }> {
    const allReviews: GoogleReview[] = [];
    let placeInfo: any = null;
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const MAX_PAGES = 10;

    try {
      // Primera página
      const params = new URLSearchParams({
        api_key: this.apiKey,
        engine: 'google_maps_reviews',
        data_id: this.dataId,
        sort_by: 'newestFirst',
        hl: 'es',
      });

      const response = await axios.get<GoogleMapsResponse>(
        `https://serpapi.com/search?${params}`,
        {
          timeout: 30000,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.place_info) {
        placeInfo = data.place_info;
      }

      if (data.reviews && data.reviews.length > 0) {
        const withText = data.reviews.filter(r => r.snippet && r.snippet.trim().length > 0);
        allReviews.push(...withText);
        this.logger.log(`📄 Página 1: ${withText.length} reseñas con texto`);
      }

      if (data.serpapi_pagination?.next_page_token) {
        nextPageToken = data.serpapi_pagination.next_page_token;
        pageCount = 1;
      } else {
        nextPageToken = undefined;
      }

      // Páginas siguientes
      while (nextPageToken && pageCount < MAX_PAGES) {
        pageCount++;
        
        const nextParams = new URLSearchParams({
          api_key: this.apiKey,
          engine: 'google_maps_reviews',
          data_id: this.dataId,
          next_page_token: nextPageToken,
          hl: 'es',
        });

        try {
          const nextResponse = await axios.get<GoogleMapsResponse>(
            `https://serpapi.com/search?${nextParams}`,
            {
              timeout: 30000,
              headers: {
                Accept: 'application/json',
              },
            }
          );

          const nextData = nextResponse.data;

          if (nextData.reviews && nextData.reviews.length > 0) {
            const withText = nextData.reviews.filter(r => r.snippet && r.snippet.trim().length > 0);
            allReviews.push(...withText);
            this.logger.log(`📄 Página ${pageCount}: ${withText.length} reseñas con texto`);
          }

          if (nextData.serpapi_pagination?.next_page_token) {
            nextPageToken = nextData.serpapi_pagination.next_page_token;
          } else {
            nextPageToken = undefined;
          }

          // Pequeña pausa para no sobrecargar la API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          this.logger.warn(`Error en página ${pageCount}: ${error.message}`);
          break;
        }
      }

      return { reviews: allReviews, placeInfo };
    } catch (error) {
      this.logger.error(`Error fetching reviews: ${error.message}`);
      throw error;
    }
  }

  private async saveReview(review: GoogleReview, placeId: string): Promise<boolean> {
    try {
      const reviewId = review.id || `review_${Date.now()}_${Math.random()}`;
      
      // Verificar si la reseña ya existe
      const existing = await this.prisma.googleReview.findUnique({
        where: { reviewId },
      });

      if (existing) {
        // Actualizar si hay cambios
        if (existing.text !== review.snippet || existing.rating !== review.rating) {
          await this.prisma.googleReview.update({
            where: { reviewId },
            data: {
              text: review.snippet || '',
              rating: review.rating || 0,
              authorImage: review.user?.thumbnail || '',
              likes: review.likes || 0,
              updatedAt: new Date(),
            },
          });
          this.logger.debug(`Updated review: ${reviewId}`);
        }
        return true;
      }

      // Crear nueva reseña
      await this.prisma.googleReview.create({
        data: {
          reviewId,
          placeId,
          authorName: review.user?.name || 'Usuario Anónimo',
          authorImage: review.user?.thumbnail || '',
          rating: review.rating || 0,
          text: review.snippet || '',
          date: review.date || '',
          likes: review.likes || 0,
        },
      });

      this.logger.debug(`Saved new review: ${reviewId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error saving review: ${error.message}`);
      return false;
    }
  }

  private async updatePlaceInfo(placeInfo: any) {
    try {
      // Verificar si ya existe información del lugar
      const existing = await this.prisma.googleMapsData.findUnique({
        where: { placeId: this.dataId },
      });

      const data = {
        placeId: this.dataId,
        name: placeInfo?.title || 'Cabs Computacion',
        rating: placeInfo?.rating || 0,
        totalRatings: placeInfo?.reviews || 0,
        address: placeInfo?.address || '',
        phone: placeInfo?.phone || '',
        website: placeInfo?.website || '',
        updatedAt: new Date(),
      };

      if (existing) {
        await this.prisma.googleMapsData.update({
          where: { placeId: this.dataId },
          data,
        });
      } else {
        await this.prisma.googleMapsData.create({
          data: {
            ...data,
            reviews: [],
          },
        });
      }

      this.logger.log('Place info updated successfully');
    } catch (error) {
      this.logger.error(`Error updating place info: ${error.message}`);
    }
  }

  private async logSync(source: string, status: string, dataHash?: string, recordsCount?: number, errorMessage?: string) {
    try {
      await this.prisma.syncLog.create({
        data: {
          source,
          status,
          dataHash: dataHash || null,
          recordsCount: recordsCount || 0,
          errorMessage: errorMessage || null,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging sync: ${error.message}`);
    }
  }

  async getReviews(limit: number = 50, offset: number = 0) {
    const [reviews, total] = await Promise.all([
      this.prisma.googleReview.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.googleReview.count(),
    ]);

    return { reviews, total };
  }

  async getPlaceInfo() {
    return this.prisma.googleMapsData.findUnique({
      where: { placeId: this.dataId },
    });
  }

  async getReviewStats() {
    const stats = await this.prisma.googleReview.groupBy({
      by: ['rating'],
      _count: true,
    });

    const total = await this.prisma.googleReview.count();
    const average = await this.prisma.googleReview.aggregate({
      _avg: { rating: true },
    });

    return {
      total,
      average: average._avg.rating || 0,
      byRating: stats.map(s => ({
        rating: s.rating,
        count: s._count,
      })),
    };
  }
}