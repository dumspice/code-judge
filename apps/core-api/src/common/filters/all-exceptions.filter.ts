/**
 * Filter toàn cục: mọi exception → HTTP response + body `ApiResponse` với `success: false`.
 * `ValidationPipe` thường trả `message` dạng mảng → gộp chuỗi và đưa `result.errors`.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let result: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        const msg = body.message;
        if (Array.isArray(msg)) {
          message = msg.join('; ');
          result = { errors: msg };
        } else if (typeof msg === 'string') {
          message = msg;
        } else {
          message = exception.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`${request.method} ${request.url} — ${exception.stack ?? exception.message}`);
    } else {
      this.logger.error(`${request.method} ${request.url} — ${String(exception)}`);
    }

    const body: ApiResponse = {
      success: false,
      code: status,
      message,
      result,
    };

    response.status(status).json(body);
  }
}
