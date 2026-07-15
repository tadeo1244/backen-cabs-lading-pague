import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataService {
  constructor(private prisma: PrismaService) {}

  async getAllData() {
    const [googleMapsData, webScrapingData] = await Promise.all([
      this.prisma.googleMapsData.findMany(),
      this.prisma.webScrapingData.findMany(),
    ]);

    return {
      googleMaps: googleMapsData,
      webScraping: webScrapingData,
      timestamp: new Date().toISOString(),
    };
  }

  async getGoogleMapsData() {
    return this.prisma.googleMapsData.findMany();
  }

  async getWebScrapingData(url?: string) {
    if (url) {
      const data = await this.prisma.webScrapingData.findUnique({
        where: { sourceUrl: url }
      });
      return data;
    }
    return this.prisma.webScrapingData.findMany();
  }

  async getSyncLogs(limit: number = 10) {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}