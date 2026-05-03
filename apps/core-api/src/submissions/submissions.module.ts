import { Module } from '@nestjs/common';
import { BullMqModule } from '../queues/bullmq.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [BullMqModule, RealtimeModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}

