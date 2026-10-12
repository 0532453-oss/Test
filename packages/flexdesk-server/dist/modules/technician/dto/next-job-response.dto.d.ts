export declare class JobLocationDto {
    address?: string;
    lat: number;
    lng: number;
}
export declare class NextJobResponseDto {
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
export declare class NoNextJobResponseDto {
    hasNextJob: false;
    message: string;
    hasJobInProgress: boolean;
    inProgressJobId?: string;
}
