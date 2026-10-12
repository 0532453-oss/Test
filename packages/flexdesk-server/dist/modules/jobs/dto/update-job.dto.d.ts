import { JobStatus } from '@prisma/client';
import { CreateJobDto } from './create-job.dto';
declare const UpdateJobDto_base: import("@nestjs/common").Type<Partial<Omit<CreateJobDto, "customerId">>>;
export declare class UpdateJobDto extends UpdateJobDto_base {
    status?: JobStatus;
}
export {};
