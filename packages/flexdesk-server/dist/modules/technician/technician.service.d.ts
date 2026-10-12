import { type Prisma, type Technician } from '@prisma/client';
import { type GoogleMapsService } from '../maps/google-maps.service';
import { type CreateTechnicianDto } from './dto/create-technician.dto';
import { type NextJobResponseDto, type NoNextJobResponseDto } from './dto/next-job-response.dto';
import { type UpdateTechnicianDto } from './dto/update-technician.dto';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
interface LocationInput {
    lat: number;
    lng: number;
}
export declare class TechnicianService extends BaseService<Prisma.TechnicianDelegate> {
    private readonly googleMapsService;
    constructor(prisma: PrismaService, googleMapsService: GoogleMapsService);
    createTechnician(dto: CreateTechnicianDto): Promise<Technician>;
    findAllTechnicians(): Promise<Technician[]>;
    findTechnicianById(id: string): Promise<Technician>;
    findTechnicianByUserId(userId: string): Promise<Technician>;
    findAvailableTechnicians(available: boolean): Promise<Technician[]>;
    updateTechnician(id: string, dto: UpdateTechnicianDto): Promise<Technician>;
    updateCurrentLocation(userId: string, location: LocationInput): Promise<void>;
    setAvailability(id: string, isAvailable: boolean): Promise<Technician>;
    getNextJob(technicianId: string): Promise<NextJobResponseDto | NoNextJobResponseDto>;
}
export {};
