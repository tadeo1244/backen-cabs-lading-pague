import { Controller, Get, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('google-maps')
export class GoogleMapsController {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get('data')
  @UseGuards(AuthGuard)
  async getGoogleMapsData() {
    return this.googleMapsService.getGoogleMapsData();
  }

  @Post('sync')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncGoogleMapsData() {
    await this.googleMapsService.syncGoogleMapsData();
    return { message: 'Google Maps data sync initiated successfully' };
  }
}