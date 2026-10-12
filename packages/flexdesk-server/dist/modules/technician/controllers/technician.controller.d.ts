import { type Technician } from '@prisma/client';
import { type AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { type CreateTechnicianDto } from '../dto/create-technician.dto';
import { NextJobResponseDto, type NoNextJobResponseDto } from '../dto/next-job-response.dto';
import { type ToggleAvailabilityDto } from '../dto/toggle-availability.dto';
import { type UpdateLocationDto } from '../dto/update-location.dto';
import { type UpdateTechnicianDto } from '../dto/update-technician.dto';
import { type TechnicianService } from '../technician.service';
export declare class TechnicianController {
    private readonly technicianService;
    constructor(technicianService: TechnicianService);
    create(dto: CreateTechnicianDto): Promise<Technician>;
    findAll(available?: boolean): Promise<Technician[]>;
    getMyProfile(user: AuthenticatedUser): Promise<Technician>;
    findOne(id: string): Promise<Technician>;
    update(id: string, dto: UpdateTechnicianDto): Promise<Technician>;
    updateLocation(dto: UpdateLocationDto, user: AuthenticatedUser): Promise<void>;
    toggleAvailability(id: string, dto: ToggleAvailabilityDto): Promise<Technician>;
    getNextJob(id: string): Promise<NextJobResponseDto | NoNextJobResponseDto>;
}
