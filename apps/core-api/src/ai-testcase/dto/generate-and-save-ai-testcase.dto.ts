import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GenerateAndSaveAiTestcaseDto {
  @ApiProperty({ example: 'problem-id-uuid' })
  @IsString()
  @MaxLength(100)
  problemId!: string;

  @ApiProperty({ example: 'creator-user-id-uuid' })
  @IsString()
  @MaxLength(100)
  createdById!: string;

  @ApiPropertyOptional({ example: 8, description: 'Override max testcase generation for this run' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxTestCases?: number;

  @ApiPropertyOptional({ example: 'Input: n\nOutput: result', description: 'Optional IO specification override' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  ioSpec?: string;

  @ApiPropertyOptional({ example: 'Supplementary text extracted from uploaded project docs' })
  @IsOptional()
  @IsString()
  @MaxLength(15000)
  supplementaryText?: string;

  @ApiPropertyOptional({ enum: ['openai', 'google'], default: 'openai' })
  @IsOptional()
  @IsIn(['openai', 'google'])
  provider?: 'openai' | 'google';

  @ApiPropertyOptional({ example: 'gpt-4.1-mini' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;
}
