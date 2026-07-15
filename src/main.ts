import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración CORS - Permitir todos los orígenes necesarios
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://cabsdgo.com',
        'https://www.cabsdgo.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4321',  
        'http://localhost:5173',
        'https://backen-cabs-lading-pague.onrender.com',
      ];
      
      // Permitir solicitudes sin origen (como Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
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