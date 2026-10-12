// Sentry must be imported before all other modules
import './instrument';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { type Request, type Response, type NextFunction, json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

import { validateRequiredEnv } from '@/core/config/env-validation';
import { HttpExceptionFilter } from '@/core/filters/http-exception.filter';
import { JsonLoggerService } from '@/core/logging/json-logger.service';
import { HealthService } from '@/modules/health/health.service';

async function bootstrap(): Promise<void> {
  // Fail fast if required env vars are missing (before NestJS bootstrap)
  validateRequiredEnv();

  const isProduction = process.env.NODE_ENV === 'production';
  const jsonLogger = isProduction ? new JsonLoggerService() : undefined;

  const app = await NestFactory.create(AppModule, {
    ...(jsonLogger ? { logger: jsonLogger } : {}),
    rawBody: true,
  });

  // HTTPS redirect in production (Railway sets x-forwarded-proto)
  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Skip liveness probe — load balancers may use HTTP internally
      if (req.path === '/api/v1/health/live') {
        return next();
      }

      if (req.headers['x-forwarded-proto'] === 'http') {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        return res.redirect(301, httpsUrl);
      }

      next();
    });
  }

  // Security headers
  app.use(helmet());

  // Cookie parsing (must be before CORS/routes)
  app.use(cookieParser());

  // Request body size limits
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5175',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation — require explicit opt-in to prevent accidental exposure
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('FlexDesk API')
      .setDescription('Field Service Management API for FlexDesk')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('jobs', 'Job management endpoints')
      .addTag('technicians', 'Technician management endpoints')
      .addTag('customers', 'Customer management endpoints')
      .addTag('invoices', 'Invoice and billing endpoints')
      .addTag('recurrence', 'Recurring job management')
      .addTag('auth', 'Authentication endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    new Logger('Bootstrap').log('Swagger documentation available at /docs');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`FlexDesk API running on port ${port}`);

  // Log external service configuration status
  const healthService = app.get(HealthService);
  const services = healthService.checkExternalServices();
  const configured = Object.entries(services)
    .filter(([, s]) => s.configured)
    .map(([name]) => name);
  const missing = Object.entries(services)
    .filter(([, s]) => !s.configured)
    .map(([name]) => name);

  if (configured.length > 0) {
    logger.log(`External services configured: ${configured.join(', ')}`);
  }
  if (missing.length > 0) {
    logger.warn(`External services NOT configured (degraded): ${missing.join(', ')}`);
  }
}

bootstrap();
