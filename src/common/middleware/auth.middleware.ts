import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Lista completa de rutas públicas
    const publicPaths = [
      '/health',
      '/api/public/data',
      '/api/public/google-maps',
      '/api/public/web-scraping',
      '/api/public/products',
      '/api/public/products/categories',
      '/google-reviews/public/reviews',
      '/google-reviews/public/place-info',
      '/google-reviews/public/stats',
    ];

    // Permitir todas las rutas públicas sin autenticación
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Si es una ruta que comienza con /api/public pero no está en la lista
    if (req.path.startsWith('/api/public')) {
      return next();
    }

    const apiKey = req.headers['x-api-key'];
    const validApiKey = this.configService.get('API_KEY');
    const origin = req.headers['origin'] || req.headers['referer'];
    const allowedOrigins = [
      'https://cabsdgo.com',
      'https://www.cabsdgo.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4321',
      'http://localhost:5173',
      'https://backen-cabs-lading-pague.onrender.com',
    ];

    // Verificar API Key
    if (apiKey && apiKey === validApiKey) {
      return next();
    }

    // Verificar origen para GET requests (solo para cabsdgo.com)
    if (origin && allowedOrigins.includes(origin) && req.method === 'GET') {
      return next();
    }

    throw new UnauthorizedException('Access denied');
  }
}