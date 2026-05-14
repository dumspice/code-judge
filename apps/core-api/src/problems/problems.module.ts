import { Module } from '@nestjs/common';
import { AiTestcaseModule } from '../ai-testcase/ai-testcase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminProblemsService } from './admin-problems.service';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  imports: [PrismaModule, AiTestcaseModule],
  controllers: [ProblemsController],
  providers: [ProblemsService, AdminProblemsService],
})
export class ProblemsModule {}
