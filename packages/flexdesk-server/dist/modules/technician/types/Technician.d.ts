import { type BaseObjectRecord } from '@/modules/object-record/types/BaseObjectRecord';
export interface TechnicianLocation {
    lat: number;
    lng: number;
    updatedAt: string;
}
export interface Technician extends BaseObjectRecord {
    userId: string;
    phone?: string | null;
    licenseNumber?: string | null;
    specialties: string[];
    currentLocation?: TechnicianLocation | null;
    isAvailable: boolean;
    firstName?: string;
    lastName?: string;
}
