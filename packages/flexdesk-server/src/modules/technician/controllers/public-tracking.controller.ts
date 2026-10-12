import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { type Job, type Technician } from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { verifyJobToken } from '@/utils/crypto';

interface PublicTechnicianInfo {
  id: string;
  name: string;
  currentLocation: Technician['currentLocation'] | null;
}

interface PublicTrackingResponse {
  job: Job | null;
  technician: PublicTechnicianInfo | null;
}

@Public()
@Controller('public')
export class PublicTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('track')
  async trackJob(@Query('token') token: string): Promise<PublicTrackingResponse> {
    if (!token) {
      throw new BadRequestException('Missing tracking token');
    }

    const payload = verifyJobToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired tracking token');
    }

    const job = await this.prisma.job.findFirst({
      where: {
        id: payload.jobId,
        workspaceId: payload.workspaceId,
      },
    });

    if (!job || !job.technicianId) {
      return {
        job,
        technician: null,
      };
    }

    const technician = await this.prisma.technician.findFirst({
      where: {
        id: job.technicianId,
        workspaceId: payload.workspaceId,
      },
      include: {
        user: true,
      },
    });

    if (!technician) {
      return {
        job,
        technician: null,
      };
    }

    const technicianInfo: PublicTechnicianInfo = {
      id: technician.id,
      name:
        technician.user?.firstName || technician.user?.lastName
          ? `${technician.user?.firstName ?? ''} ${technician.user?.lastName ?? ''}`.trim()
          : 'Technician',
      currentLocation: technician.currentLocation as any,
    };

    return {
      job,
      technician: technicianInfo,
    };
  }
}

