// `reflect-metadata` bắt buộc với NestJS decorator / DI.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

/**
 * Khởi tạo HTTP server NestJS: CORS, validate DTO, bắt lỗi & bọc response thống nhất.
 *
 * Thứ tự xử lý response: controller trả dữ liệu “thô” → `TransformResponseInterceptor` bọc
 * `{ code, success, message, result }`. Mọi exception → `AllExceptionsFilter` trả cùng dạng envelope.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend (Next.js) gọi API và Socket.io từ origin khác trong dev.
  app.enableCors({
    origin: true,
    credentials: false,
  });

  // Chuẩn hoá validate/transform DTO: strip field thừa, báo lỗi field không khai báo.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Lỗi HTTP / runtime → JSON `{ success: false, code, message, result }`.
  app.useGlobalFilters(new AllExceptionsFilter());
  // Thành công → bọc thêm envelope; không đụng `StreamableFile` / response đã gửi.
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  console.log(`[core-api] listening on :${port}`);
}

bootstrap();

