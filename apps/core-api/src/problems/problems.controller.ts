import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { CurrentUser, Public, Roles } from '../common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemsService } from './problems.service';
import type { Role } from '@prisma/client';

@ApiTags('problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Public()
  @ApiOperation({ summary: 'Danh sách problem public' })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.problemsService.findAll({
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
  @ApiOperation({ summary: 'Owner tạo problem mới' })
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateProblemDto) {
    return this.problemsService.create(dto, user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Owner cập nhật problem' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProblemDto,
  ) {
    return this.problemsService.update(id, dto, user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Owner xóa problem' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.problemsService.delete(id, user.userId);
  }
}
