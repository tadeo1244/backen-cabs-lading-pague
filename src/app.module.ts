import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleMapsModule } from './modules/google-maps/google-maps.module';
import { GoogleReviewsModule } from './modules/google-reviews/google-reviews.module'; // Importar el nuevo módulo
import { WebScrapingModule } from './modules/web-scraping/web-scraping.module';
import { DataModule } from './modules/data/data.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    GoogleMapsModule,
    GoogleReviewsModule, 
    WebScrapingModule,
    DataModule,
    SchedulerModule,
    HealthModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'api/public/data', method: RequestMethod.ALL },
        { path: 'api/public/google-maps', method: RequestMethod.ALL },
        { path: 'api/public/web-scraping', method: RequestMethod.ALL },
        { path: 'api/public/products', method: RequestMethod.ALL },
        { path: 'api/public/products/categories', method: RequestMethod.ALL },
        { path: 'google-reviews/public/(.*)', method: RequestMethod.ALL }, // Agregar rutas públicas de Google Reviews
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}