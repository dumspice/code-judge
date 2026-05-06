import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { EnvKeys, STORAGE_DEFAULT_BUCKET, STORAGE_DEFAULT_REGION } from '../common';

export interface PresignedUploadInput {
  objectKey: string;
  expiresInSeconds?: number;
  contentType?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly client: Client;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get<string>(EnvKeys.MINIO_ENDPOINT) ?? 'localhost';
    const portRaw = this.config.get<string>(EnvKeys.MINIO_PORT) ?? '9000';
    const useSSLRaw = (this.config.get<string>(EnvKeys.MINIO_USE_SSL) ?? 'false').toLowerCase();
    const accessKey = this.config.get<string>(EnvKeys.MINIO_ACCESS_KEY) ?? 'minioadmin';
    const secretKey = this.config.get<string>(EnvKeys.MINIO_SECRET_KEY) ?? 'minioadmin';

    this.bucket = this.config.get<string>(EnvKeys.MINIO_BUCKET) ?? STORAGE_DEFAULT_BUCKET;
    this.publicBaseUrl = this.config.get<string>(EnvKeys.MINIO_PUBLIC_BASE_URL) ?? null;

    this.client = new Client({
      endPoint,
      port: Number(portRaw),
      useSSL: ['1', 'true', 'yes'].includes(useSSLRaw),
      accessKey,
      secretKey,
      region: this.config.get<string>(EnvKeys.MINIO_REGION) ?? STORAGE_DEFAULT_REGION,
    });
  }

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created bucket "${this.bucket}"`);
    }
  }

  async createPresignedUploadUrl(input: PresignedUploadInput): Promise<string> {
    const { objectKey, expiresInSeconds = 900, contentType } = input;
    await this.ensureBucketExists();
    return this.client.presignedPutObject(this.bucket, objectKey, expiresInSeconds);
  }

  async createPresignedDownloadUrl(objectKey: string, expiresInSeconds = 900): Promise<string> {
    await this.ensureBucketExists();
    return this.client.presignedGetObject(this.bucket, objectKey, expiresInSeconds);
  }

  async putObject(
    objectKey: string,
    body: Buffer | string,
    metaData?: Record<string, string>,
  ): Promise<void> {
    await this.ensureBucketExists();
    this.logger.log(`Putting object ${objectKey} with metadata ${JSON.stringify(metaData)}`);
    await this.client.putObject(this.bucket, objectKey, body, undefined, metaData);
    this.logger.log(`Object ${objectKey} put successfully`);
  }

  async removeObject(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }

  getObjectUrl(objectKey: string): string {
    if (!this.publicBaseUrl) {
      return `s3://${this.bucket}/${objectKey}`;
    }
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${this.bucket}/${objectKey}`;
  }

  getBucketName(): string {
    return this.bucket;
  }
}
