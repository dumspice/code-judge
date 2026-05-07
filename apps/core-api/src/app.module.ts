import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BullMqModule } from './queues/bullmq.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { ClassroomModule } from './classrooms/classroom.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    UsersModule,
    ClassroomModule,
    StorageModule,
    PrismaModule,
    RealtimeModule,
    BullMqModule,
    SubmissionsModule,
  ],
})
export class AppModule { }

