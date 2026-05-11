import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContestsController } from './contests.controller';
import { ContestsService } from './contests.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContestsController],
  providers: [ContestsService],
})
export class ContestsModule {}
