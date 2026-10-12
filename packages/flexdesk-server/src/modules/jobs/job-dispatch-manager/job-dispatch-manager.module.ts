import { Module } from '@nestjs/common';

import { JobDispatchManagerService } from './job-dispatch-manager.service';

@Module({
  providers: [JobDispatchManagerService],
  exports: [JobDispatchManagerService],
})
export class JobDispatchManagerModule {}
