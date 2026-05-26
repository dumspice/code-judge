import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class GenerateAiTemplatesDto {
  @ApiProperty({ description: 'Tiêu đề bài toán' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Mô tả chi tiết / Đề bài' })
  @IsNotEmpty()
  @IsString()
  statement!: string;

  @ApiProperty({ description: 'Danh sách các ngôn ngữ cần sinh template (e.g. PYTHON, JAVASCRIPT, CPP, JAVA, GO, RUST)' })
  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @ApiPropertyOptional({ enum: ['openai', 'google'] })
  @IsOptional()
  @IsString()
  provider?: 'openai' | 'google';

  @ApiPropertyOptional({ description: 'Model identifier (optional)' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Language locale (en or vi)', enum: ['en', 'vi'] })
  @IsOptional()
  @IsIn(['en', 'vi'])
  locale?: 'en' | 'vi';
}
