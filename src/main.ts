import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración CORS - Permitir todos los orígenes para desarrollo
  app.enableCors({
    origin: [
      'https://cabsdgo.com',
      'https://www.cabsdgo.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4321', // Astro
      'http://localhost:5173', // Vite
      'https://backen-cabs-lading-pague.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-API-Key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();