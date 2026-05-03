import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvKeys, requireEnv } from '../common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Chuỗi kết nối Postgres bắt buộc có để tạo adapter.
    const connectionString = requireEnv(EnvKeys.DATABASE_URL, process.env.DATABASE_URL);

    // Prisma 7: kết nối trực tiếp qua driver adapter (`@prisma/adapter-pg`).
    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // Base project: cho phép app khởi động khi DB chưa sẵn sàng (dev/docker chưa bật).
      // Request thực tế vẫn sẽ lỗi cho tới khi DB reachable.
      console.warn(
        '[core-api] Prisma connect failed (will retry on demand):',
        (err as Error)?.message ?? err,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

