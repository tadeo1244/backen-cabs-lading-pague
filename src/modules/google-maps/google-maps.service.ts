import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async syncGoogleMapsData() {
    this.logger.log('Google Maps sync is now handled by GoogleReviewsService with SerpApi');
    // Este servicio ahora es manejado por GoogleReviewsService
    // Mantenemos el método para compatibilidad
    return { message: 'Use GoogleReviewsService for reviews sync' };
  }

  async getGoogleMapsData() {
    return this.prisma.googleMapsData.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
  }
}