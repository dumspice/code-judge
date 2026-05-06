import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  problemId!: string;

  @ApiProperty({ enum: ['ALGO', 'PROJECT'], example: 'ALGO' })
  @IsString()
  @IsIn(['ALGO', 'PROJECT'])
  mode!: 'ALGO' | 'PROJECT';

  @ApiPropertyOptional({ example: 'print("hi")' })
  @IsOptional()
  @IsString()
  sourceCode?: string;

  @ApiPropertyOptional({
    example: 'submissions/clx.../source/main.py',
    description: 'Object key source code đã upload lên MinIO/S3',
  })
  @IsOptional()
  @IsString()
  sourceCodeObjectKey?: string;
}

