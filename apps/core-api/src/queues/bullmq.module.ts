import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { Queue, QueueEvents } from 'bullmq';
import { JUDGE_SUBMISSIONS_QUEUE_NAME } from '../common';
import { RealtimeModule } from '../realtime/realtime.module';
import { BullMqEventsService } from './bullmq-events.service';
import { JUDGE_QUEUE, JUDGE_QUEUE_EVENTS, REDIS_CONNECTION } from './tokens';

@Module({
  imports: [RealtimeModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        return new IORedis(redisUrl, { maxRetriesPerRequest: null });
      },
    },
    {
      provide: JUDGE_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (redis: IORedis) => {
        return new Queue(JUDGE_SUBMISSIONS_QUEUE_NAME, { connection: redis });
      },
    },
    {
      provide: JUDGE_QUEUE_EVENTS,
      inject: [REDIS_CONNECTION],
      useFactory: (redis: IORedis) => {
        return new QueueEvents(JUDGE_SUBMISSIONS_QUEUE_NAME, { connection: redis });
      },
    },
    BullMqEventsService,
  ],
  exports: [JUDGE_QUEUE],
})
export class BullMqModule {}

