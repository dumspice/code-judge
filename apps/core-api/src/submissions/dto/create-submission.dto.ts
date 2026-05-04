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
}

