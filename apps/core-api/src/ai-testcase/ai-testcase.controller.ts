import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '../common';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { GenerateAiTestcaseDto } from './dto/generate-ai-testcase.dto';
import { AiTestcaseService } from './ai-testcase.service';
import { QuickGenerateAiTestcaseDto } from './dto/quick-generate-ai-testcase.dto';
import { GenerateAndSaveAiTestcaseDto } from './dto/generate-and-save-ai-testcase.dto';

@ApiTags('ai-testcase')
@ApiBearerAuth('JWT')
@Controller('ai-testcase')
export class AiTestcaseController {
  constructor(private readonly aiTestcaseService: AiTestcaseService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Quick test AI (chỉ ADMIN): paste đề và sinh testcase ngay',
  })
  @Post('quick-generate')
  async quickGenerate(@Body() dto: QuickGenerateAiTestcaseDto) {
    return this.aiTestcaseService.quickGenerate(dto);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Sinh bản nháp testcase từ AI (chỉ ADMIN)',
  })
  @Post('generate-draft')
  async generateDraft(@Body() dto: GenerateAiTestcaseDto) {
    return this.aiTestcaseService.generateDraft(dto);
  }

  @ApiOperation({
    summary:
      'Sinh testcase và ghi DB (ALGO) — user đã đăng nhập; chỉ chủ đề (creator) hoặc admin; createdById trong body bị bỏ qua, dùng JWT',
  })
  @Post('generate-and-save')
  async generateAndSave(@CurrentUser() user: RequestUser, @Body() dto: GenerateAndSaveAiTestcaseDto) {
    return this.aiTestcaseService.generateAndSave(dto, user);
  }

  @ApiOperation({
    summary: 'Danh sách tài liệu upload gắn job AI của một problem (theo quyền creator / chủ job / admin)',
  })
  @Get('problems/:problemId/documents')
  async listProblemDocuments(@CurrentUser() user: RequestUser, @Param('problemId') problemId: string) {
    return this.aiTestcaseService.listProblemDocuments(problemId, user);
  }

  @ApiOperation({
    summary: 'Presigned download cho tài liệu input của job AI (quyền creator job / creator problem / admin)',
  })
  @Get('jobs/:jobId/document/download')
  async getJobDocumentDownload(
    @CurrentUser() user: RequestUser,
    @Param('jobId') jobId: string,
    @Query('expiresInSeconds') expiresInSeconds?: string,
  ) {
    return this.aiTestcaseService.getJobDocumentDownload(
      jobId,
      user,
      expiresInSeconds ? Number(expiresInSeconds) : undefined,
    );
  }
}
