import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common';
import { GenerateAiTestcaseDto } from './dto/generate-ai-testcase.dto';
import { AiTestcaseService } from './ai-testcase.service';
import { QuickGenerateAiTestcaseDto } from './dto/quick-generate-ai-testcase.dto';

@ApiTags('ai-testcase')
@Public()
@Controller('ai-testcase')
export class AiTestcaseController {
  constructor(private readonly aiTestcaseService: AiTestcaseService) {}

  @ApiOperation({
    summary: 'Quick test API: paste problem statement and generate testcase immediately',
  })
  @Post('quick-generate')
  async quickGenerate(@Body() dto: QuickGenerateAiTestcaseDto) {
    return this.aiTestcaseService.quickGenerate(dto);
  }

  @ApiOperation({
    summary: 'Generate testcase draft from AI with context prompt',
  })
  @Post('generate-draft')
  async generateDraft(@Body() dto: GenerateAiTestcaseDto) {
    return this.aiTestcaseService.generateDraft(dto);
  }
}
