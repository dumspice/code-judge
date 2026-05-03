import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  problemId!: string;

  @IsString()
  @IsIn(['ALGO', 'PROJECT'])
  mode!: 'ALGO' | 'PROJECT';

  @IsOptional()
  @IsString()
  sourceCode?: string;
}

