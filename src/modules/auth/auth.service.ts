import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  validateApiKey(apiKey: string): boolean {
    const validApiKey = this.configService.get('API_KEY');
    return apiKey === validApiKey;
  }

  validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://cabsdgo.com',
      'https://www.cabsdgo.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    return allowedOrigins.includes(origin);
  }
}