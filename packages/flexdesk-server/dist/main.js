"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./instrument");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = require("cookie-parser");
const express_1 = require("express");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./core/filters/http-exception.filter");
const logger_service_1 = require("./core/logger/logger.service");
async function bootstrap() {
    const structuredLogger = logger_service_1.StructuredLogger.getInstance();
    if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
        structuredLogger.error('CORS_ORIGIN must be set in production. Set it to your frontend domains.', 'Bootstrap');
        throw new Error('CORS_ORIGIN must be set in production. Set it to your frontend domains.');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: structuredLogger,
        rawBody: true,
    });
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.path.startsWith('/api/v1/health')) {
                return next();
            }
            if (req.headers['x-forwarded-proto'] === 'http') {
                const httpsUrl = `https://${req.headers.host}${req.url}`;
                return res.redirect(301, httpsUrl);
            }
            next();
        });
    }
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_1.json)({ limit: '1mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '1mb' }));
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5175',
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    if (process.env.ENABLE_SWAGGER === 'true') {
        const config = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document);
        structuredLogger.log('Swagger documentation available at /docs', 'Bootstrap');
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    structuredLogger.log(`FlexDesk API running on port ${port}`, 'Bootstrap');
}
bootstrap();
