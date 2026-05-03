import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionsService } from './submissions.service';

/** Tạm thời mở công khai; khi tích hợp auth, bỏ `@Public()` và truyền user từ JWT. */
@Public()
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() dto: CreateSubmissionDto) {
    const submission = await this.submissionsService.createAndEnqueue(dto);
    return {
      submissionId: submission.id,
      status: submission.status,
    };
  }
}

