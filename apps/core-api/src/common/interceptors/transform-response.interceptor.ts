/**
 * Bọc body thành công thành `ApiResponse`. Tránh bọc kép nếu controller đã trả đủ 4 field.
 * Trường hợp đặc biệt: file stream / `@Res()` đã gửi → không sửa body.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../interfaces/api-response.interface';

function isAlreadyApiEnvelope(data: unknown): data is ApiResponse {
  if (data === null || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.success === 'boolean' &&
    typeof o.code === 'number' &&
    typeof o.message === 'string' &&
    'result' in o
  );
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof StreamableFile) {
          return data;
        }

        const res = context.switchToHttp().getResponse<Response>();
        if (res.headersSent) {
          return data;
        }

        if (isAlreadyApiEnvelope(data)) {
          return data;
        }

        const code = res.statusCode || 200;
        const envelope: ApiResponse = {
          success: code >= 200 && code < 300,
          code,
          message: 'OK',
          result: data === undefined ? null : data,
        };
        return envelope;
      }),
    );
  }
}
