import { Module } from '@nestjs/common';

import { JobCompletionManagerService } from './job-completion-manager.service';

@Module({
  providers: [JobCompletionManagerService],
  exports: [JobCompletionManagerService],
})
export class JobCompletionManagerModule {}
