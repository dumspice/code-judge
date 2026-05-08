import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildAiGeneratedTestcaseObjectKeys,
  buildAiInputObjectKey,
  buildAvatarObjectKey,
  buildExportObjectKey,
  buildGoldenSolutionObjectKey,
  buildSubmissionArtifactObjectKey,
  buildSubmissionSourceObjectKey,
} from './storage-key.builder';
import { StorageService } from './storage.service';

type ResourceKind =
  | 'avatar'
  | 'submission-source'
  | 'submission-artifact'
  | 'golden-solution'
  | 'ai-input'
  | 'ai-testcase'
  | 'export';

interface PresignRequestBody {
  resourceKind: ResourceKind;
  userId?: string;
  submissionId?: string;
  problemId?: string;
  goldenSolutionId?: string;
  jobId?: string;
  contestId?: string;
  exportId?: string;
  fileName?: string;
  extension?: string;
  testCaseIndex?: number;
  expiresInSeconds?: number;
}

interface BindObjectKeyBody {
  resourceKind: 'ai-input' | 'export' | 'golden-solution';
  recordId: string;
  objectKey: string;
  // Optional metadata used for document listing in feature modules (for example ai-testcase).
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('presign/upload')
  @ApiOperation({ summary: 'Tạo presigned PUT URL cho MinIO/S3' })
  async presignUpload(@Body() body: PresignRequestBody) {
    // The server controls key format to keep object namespace predictable and safe.
    const objectKey = this.resolveObjectKey(body);
    const uploadUrl = await this.storage.createPresignedUploadUrl({
      objectKey,
      expiresInSeconds: body.expiresInSeconds ?? 900,
    });
    return {
      bucket: this.storage.getBucketName(),
      objectKey,
      uploadUrl,
    };
  }

  @Public()
  @Get('presign/download')
  @ApiOperation({ summary: 'Tạo presigned GET URL từ object key' })
  async presignDownload(
    @Query('objectKey') objectKey?: string,
    @Query('expiresInSeconds') expiresInSeconds?: string,
  ) {
    if (!objectKey) {
      throw new BadRequestException('objectKey is required');
    }
    const ttl = expiresInSeconds ? Number(expiresInSeconds) : 900;
    // Download URL is short-lived and should be requested on demand.
    const downloadUrl = await this.storage.createPresignedDownloadUrl(objectKey, ttl);
    return { objectKey, downloadUrl };
  }

  @Public()
  @Post('bind-object-key')
  @ApiOperation({ summary: 'Gắn object key vào record nghiệp vụ (AI input / export / golden)' })
  async bindObjectKey(@Body() body: BindObjectKeyBody) {
    if (!body.recordId || !body.objectKey) {
      throw new BadRequestException('recordId and objectKey are required');
    }

    switch (body.resourceKind) {
      case 'ai-input':
        // Persist both object key and lightweight file metadata
        // so consumers can show document list without reading MinIO directly.
        return this.prisma.aiGenerationJob.update({
          where: { id: body.recordId },
          data: {
            inputDocObjectKey: body.objectKey,
            inputDocUrl: this.storage.getObjectUrl(body.objectKey),
            inputDocFileName: body.fileName,
            inputDocContentType: body.contentType,
            inputDocSizeBytes: body.sizeBytes,
          },
        });
      case 'export':
        // Persist object key and resolved URL for report retrieval.
        return this.prisma.reportExport.update({
          where: { id: body.recordId },
          data: {
            fileObjectKey: body.objectKey,
            fileUrl: this.storage.getObjectUrl(body.objectKey),
          },
        });
      case 'golden-solution':
        // Golden source may be stored externally to avoid large DB text payloads.
        return this.prisma.goldenSolution.update({
          where: { id: body.recordId },
          data: {
            sourceCodeObjectKey: body.objectKey,
          },
        });
      default:
        throw new BadRequestException('Unsupported resourceKind');
    }
  }

  private resolveObjectKey(body: PresignRequestBody): string {
    // Keep all object-key naming centralized to enforce consistent bucket taxonomy.
    switch (body.resourceKind) {
      case 'avatar':
        return buildAvatarObjectKey(body.userId ?? 'unknown', body.extension ?? 'bin');
      case 'submission-source':
        return buildSubmissionSourceObjectKey(body.submissionId ?? 'unknown', body.fileName);
      case 'submission-artifact':
        return buildSubmissionArtifactObjectKey(
          body.submissionId ?? 'unknown',
          body.fileName ?? 'artifact.bin',
        );
      case 'golden-solution':
        return buildGoldenSolutionObjectKey(
          body.problemId ?? 'unknown',
          body.goldenSolutionId ?? 'unknown',
          body.fileName ?? 'source.txt',
        );
      case 'ai-input':
        return buildAiInputObjectKey(body.jobId ?? 'unknown', body.fileName ?? 'input.bin');
      case 'ai-testcase': {
        const keys = buildAiGeneratedTestcaseObjectKeys(body.jobId ?? 'unknown', body.testCaseIndex ?? 0);
        return body.fileName === 'expected.txt' ? keys.expected : keys.input;
      }
      case 'export':
        return buildExportObjectKey(
          body.contestId ?? 'unknown',
          body.exportId ?? 'unknown',
          body.extension ?? 'bin',
        );
      default:
        return buildSubmissionArtifactObjectKey('unknown', 'unknown.bin');
    }
  }
}
