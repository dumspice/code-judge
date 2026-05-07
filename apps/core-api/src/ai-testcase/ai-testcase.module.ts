import { Module } from '@nestjs/common';
import { AiTestcaseController } from './ai-testcase.controller';
import { AiTestcaseService } from './ai-testcase.service';

@Module({
  controllers: [AiTestcaseController],
  providers: [AiTestcaseService],
  exports: [AiTestcaseService],
})
export class AiTestcaseModule {}
