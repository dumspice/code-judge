import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { formatPagedList, hashPassword } from '../common';
import { PrismaService } from '../prisma/prisma.service';
import { buildAvatarObjectKey } from '../storage/storage-key.builder';
import { StorageService } from '../storage/storage.service';
import { AvatarUploadDto } from './dto/avatar-upload.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email đã được sử dụng');

    const id = dto.id ?? randomBytes(12).toString('hex');
    const passwordHash = dto.password ? await hashPassword(dto.password) : null;
    return this.prisma.user.create({
      data: {
        id,
        name: dto.name,
        email: dto.email,
        role: dto.role!,
        passwordHash,
        isActive: true,
        emailVerified: true,
      },
    });
  }

  async findAll(query: ListUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return formatPagedList(items, total, page, limit);
  }

  async findById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (dto.email && dto.email !== user.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email đã được sử dụng');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async remove(userId: string): Promise<{ success: boolean }> {
    await this.findById(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async createAvatarUploadUrl(userId: string, dto: AvatarUploadDto) {
    await this.findById(userId);
    const objectKey = buildAvatarObjectKey(userId, dto.extension ?? 'bin');
    const uploadUrl = await this.storage.createPresignedUploadUrl({
      objectKey,
      expiresInSeconds: 900,
    });
    return {
      objectKey,
      uploadUrl,
      bucket: this.storage.getBucketName(),
    };
  }

  async confirmAvatarObjectKey(userId: string, objectKey: string): Promise<User> {
    await this.findById(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        image: this.storage.getObjectUrl(objectKey),
      },
    });
  }

  async searchByEmail(q: string) {
  return this.prisma.user.findMany({
    where: {
      email: {
        contains: q,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
    take: 10,
  });
}
}
