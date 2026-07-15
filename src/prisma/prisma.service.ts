import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Configurar pool para producción con Render
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Máximo de conexiones
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Necesario para Render
      } : false,
    });
    
    const adapter = new PrismaPg(pool);
    
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['warn', 'error'],
    });
    
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}