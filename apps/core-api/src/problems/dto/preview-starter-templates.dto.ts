import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class PreviewTestCaseInputDto {
  @IsString()
  input!: string;
}

export class PreviewStarterTemplatesDto {
  @ApiPropertyOptional({ example: ['PYTHON', 'GO', 'RUST'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ description: 'Template đã nhập; ngôn ngữ rỗng sẽ được điền boilerplate mặc định' })
  @IsOptional()
  @IsObject()
  templateCode?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Dùng để suy số tham số stdin (arity) cho boilerplate' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewTestCaseInputDto)
  testCases?: PreviewTestCaseInputDto[];
}
