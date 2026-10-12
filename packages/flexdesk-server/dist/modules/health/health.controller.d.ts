import { type Response } from 'express';
import { type HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(res: Response): Promise<Response<any, Record<string, any>>>;
    details(): Promise<import("./health.service").HealthCheckResult>;
    ready(res: Response): Promise<Response<any, Record<string, any>>>;
    live(): {
        status: string;
    };
}
