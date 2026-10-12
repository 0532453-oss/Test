import { Module } from '@nestjs/common';

import { JobSchedulingManagerService } from './job-scheduling-manager.service';

@Module({
  providers: [JobSchedulingManagerService],
  exports: [JobSchedulingManagerService],
})
export class JobSchedulingManagerModule {}
