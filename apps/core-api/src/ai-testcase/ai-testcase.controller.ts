import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common';
import { GenerateAiTestcaseDto } from './dto/generate-ai-testcase.dto';
import { AiTestcaseService } from './ai-testcase.service';
import { QuickGenerateAiTestcaseDto } from './dto/quick-generate-ai-testcase.dto';
import { GenerateAndSaveAiTestcaseDto } from './dto/generate-and-save-ai-testcase.dto';

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

  @ApiOperation({
    summary: 'Generate testcase and persist to DB for ALGO problem (PROJECT is setup-only)',
  })
  @Post('generate-and-save')
  async generateAndSave(@Body() dto: GenerateAndSaveAiTestcaseDto) {
    // Main endpoint for production flow:
    // - ALGO: generate + persist testcase rows
    // - PROJECT: only create setup metadata for future storage integration
    return this.aiTestcaseService.generateAndSave(dto);
  }

  @ApiOperation({
    summary: 'List uploaded AI input documents of a problem from MinIO metadata',
  })
  @Get('problems/:problemId/documents')
  async listProblemDocuments(@Param('problemId') problemId: string) {
    // Returns document metadata that is already bound to AiGenerationJob.
    return this.aiTestcaseService.listProblemDocuments(problemId);
  }

  @ApiOperation({
    summary: 'Get a presigned download URL for AI input document of a generation job',
  })
  @Get('jobs/:jobId/document/download')
  async getJobDocumentDownload(
    @Param('jobId') jobId: string,
    @Query('expiresInSeconds') expiresInSeconds?: string,
  ) {
    // Returns a short-lived download URL (presigned GET) for the job document.
    return this.aiTestcaseService.getJobDocumentDownload(
      jobId,
      expiresInSeconds ? Number(expiresInSeconds) : undefined,
    );
  }
}
