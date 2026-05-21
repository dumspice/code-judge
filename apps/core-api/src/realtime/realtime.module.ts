import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SubmissionGateway } from './submission.gateway';
import { SocketAuthService } from './socket-auth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, JwtModule.register({}), PrismaModule],
  providers: [SocketAuthService, SubmissionGateway],
  exports: [SubmissionGateway],
})
export class RealtimeModule {}
