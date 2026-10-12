import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@/core/database/prisma.service';

interface ServiceStatus {
  configured: boolean;
}

interface DatabaseStatus {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  database: DatabaseStatus;
  services: Record<string, ServiceStatus>;
  memory: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkDatabase(): Promise<DatabaseStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${message}`);
      return { status: 'down', error: 'Database unreachable' };
    }
  }

  checkExternalServices(): Record<string, ServiceStatus> {
    return {
      sendgrid: {
        configured: this.isConfigured('SENDGRID_API_KEY'),
      },
      twilio: {
        configured: this.isConfigured('TWILIO_ACCOUNT_SID'),
      },
      googleMaps: {
        configured: this.isConfigured('GOOGLE_MAPS_API_KEY'),
      },
      stripe: {
        configured: this.isConfigured('STRIPE_SECRET_KEY'),
      },
    };
  }

  getMemoryUsage(): { rss: string; heapUsed: string; heapTotal: string } {
    const mem = process.memoryUsage();
    return {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    };
  }

  async getFullHealth(): Promise<HealthCheckResult> {
    const database = await this.checkDatabase();
    const services = this.checkExternalServices();
    const memory = this.getMemoryUsage();

    const status = database.status === 'up' ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database,
      services,
      memory,
    };
  }

  private isConfigured(key: string): boolean {
    const value = this.configService.get<string>(key);
    return !!value && value !== '';
  }
}
