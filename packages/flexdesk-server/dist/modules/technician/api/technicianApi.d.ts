import type { Technician, TechnicianLocation } from '../types/Technician';
export interface NextJobResponse {
    jobId: string;
    customerName: string;
    title: string;
    address?: string;
    lat?: number;
    lng?: number;
    scheduledAt: string;
    travelTimeMinutes?: number;
    travelDistanceMeters?: number;
    minutesUntilStart: number;
    directionsUrl: string;
    hasJobInProgress: boolean;
    inProgressJobId?: string;
}
export interface NoNextJobResponse {
    hasNextJob: false;
    message: string;
    hasJobInProgress: boolean;
    inProgressJobId?: string;
}
export type NextJobResult = NextJobResponse | NoNextJobResponse;
export declare function hasNextJob(result: NextJobResult): result is NextJobResponse;
export declare const technicianApi: {
    getTechnician(technicianId: string): Promise<Technician>;
    getTechnicians(params?: {
        filter?: Record<string, any>;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: Technician[];
        hasMore: boolean;
    }>;
    updateLocation(technicianId: string, location: TechnicianLocation): Promise<Technician>;
    updateAvailability(technicianId: string, isAvailable: boolean): Promise<Technician>;
    getNextJob(technicianId: string): Promise<NextJobResult>;
};
