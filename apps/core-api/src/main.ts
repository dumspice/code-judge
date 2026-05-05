// `reflect-metadata` bắt buộc với NestJS decorator / DI.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
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
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });

  app.use(cookieParser());

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

  const swaggerOff =
    process.env.NODE_ENV === 'production' || process.env.SWAGGER_ENABLED === '0';
  if (!swaggerOff) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Code Judge API')
      .setDescription('HTTP API cho Code Judge (response thực tế bọc envelope qua interceptor).')
      .setVersion('0.1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT từ POST /auth/login' },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      jsonDocumentUrl: 'api-docs/json',
      yamlDocumentUrl: 'api-docs/yaml',
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  console.log(`[core-api] listening on :${port}`);
  if (!swaggerOff) {
    console.log(`[core-api] Swagger UI: http://localhost:${port}/api-docs`);
  }
}

bootstrap();

