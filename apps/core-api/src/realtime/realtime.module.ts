import { Module } from '@nestjs/common';
import { SubmissionGateway } from './submission.gateway';

@Module({
  providers: [SubmissionGateway],
  exports: [SubmissionGateway],
})
export class RealtimeModule {}

