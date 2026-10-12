/**
 * Maps Module
 *
 * Provides Google Maps integration services
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GoogleMapsService } from './google-maps.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GoogleMapsService],
  exports: [GoogleMapsService],
})
export class MapsModule {}
