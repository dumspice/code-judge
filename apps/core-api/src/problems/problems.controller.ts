import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { CurrentUser, Public, Roles } from '../common';
import { GenerateAiTestcaseDto } from '../ai-testcase/dto/generate-ai-testcase.dto';
import { AiTestcaseService } from '../ai-testcase/ai-testcase.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemsService } from './problems.service';

@ApiTags('problems')
@Controller('problems')
export class ProblemsController {
  constructor(
    private readonly problemsService: ProblemsService,
    private readonly aiTestcaseService: AiTestcaseService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Danh sách problem public' })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('classRoomId') classRoomId?: string,
  ) {
    return this.problemsService.findAll({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      classRoomId,
    });
  }

  @ApiBearerAuth('JWT')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Danh sách tất cả problem' })
  @Get('admin')
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.problemsService.findAllAdmin({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @ApiOperation({ summary: 'Lấy chi tiết problem theo id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.problemsService.findById(id);
  }

  @ApiBearerAuth('JWT')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Admin: sinh bản nháp test case bằng AI (chưa lưu DB; dùng trước khi tạo problem)',
  })
  @Post('generate-test-cases-draft')
  async generateTestCasesDraft(@Body() dto: GenerateAiTestcaseDto) {
    return this.aiTestcaseService.generateDraft(dto);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Owner tạo problem mới' })
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateProblemDto) {
    return this.problemsService.create(dto, user.userId, user.role === 'ADMIN');
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Owner cập nhật problem' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProblemDto,
  ) {
    return this.problemsService.update(
      id,
      dto,
      user.userId,
      user.role === 'ADMIN',
    );
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Owner xóa problem' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.problemsService.delete(id, user.userId, user.role === 'ADMIN');
  }
}
