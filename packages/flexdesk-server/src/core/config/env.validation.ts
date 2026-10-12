import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Min(1)
  PORT?: number = 3001;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '15m';

  @IsString()
  @IsOptional()
  @IsUrl({ require_tld: false })
  CORS_ORIGIN?: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  PUBLIC_APP_URL?: string = 'http://localhost:3000';

  @IsNumber()
  @IsOptional()
  @Min(0)
  DEFAULT_JOB_HOURLY_RATE?: number = 100;

  @IsNumber()
  @IsOptional()
  @Min(0)
  DEFAULT_TAX_RATE?: number = 0.1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  DEFAULT_INVOICE_DUE_DATE_DAYS?: number = 30;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string = '';

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string = '';

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string = '';

  @IsString()
  @IsOptional()
  SENDGRID_FROM_EMAIL?: string = 'noreply@flexdesk.io';

  @IsString()
  @IsOptional()
  SENDGRID_FROM_NAME?: string = 'FlexDesk';

  @IsString()
  CUSTOMER_PORTAL_SECRET: string;

  @IsString()
  JOB_TOKEN_SECRET: string;

  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID?: string = '';

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN?: string = '';

  @IsString()
  @IsOptional()
  TWILIO_FROM_NUMBER?: string = '';

  @IsString()
  @IsOptional()
  GOOGLE_MAPS_API_KEY?: string = '';

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ require_tld: false })
  FRONTEND_URL?: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown error';
      return `${error.property}: ${constraints}`;
    });

    throw new Error(`Config validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}
