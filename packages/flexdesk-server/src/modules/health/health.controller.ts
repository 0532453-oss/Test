import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { type Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';

import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check with database connectivity' })
  async check(@Res() res: Response) {
    const db = await this.healthService.checkDatabase();

    if (db.status === 'up') {
      return res.status(HttpStatus.OK).json({
        status: 'healthy',
        database: { status: 'up', latencyMs: db.latencyMs },
      });
    }

    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      status: 'unhealthy',
      database: { status: 'down' },
    });
  }

  @Get('details')
  @ApiOperation({ summary: 'Detailed health check with DB and service status (requires auth)' })
  async details() {
    return this.healthService.getFullHealth();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe — returns 503 if DB is down' })
  async ready(@Res() res: Response) {
    const health = await this.healthService.getFullHealth();

    if (health.status === 'unhealthy') {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        reason: 'Database is unreachable',
      });
    }

    return res.status(HttpStatus.OK).json({ status: 'ready' });
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe — always returns 200 if process is running' })
  live() {
    return { status: 'alive' };
  }
}
