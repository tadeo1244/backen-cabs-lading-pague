import { Module } from '@nestjs/common';
import { GoogleReviewsService } from './google-reviews.service';
import { GoogleReviewsController } from './google-reviews.controller';

@Module({
  providers: [GoogleReviewsService],
  controllers: [GoogleReviewsController],
  exports: [GoogleReviewsService],
})
export class GoogleReviewsModule {}