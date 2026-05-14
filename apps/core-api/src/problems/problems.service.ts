import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Difficulty, ProblemMode, ProblemVisibility, Prisma, Problem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProblemDto, creatorId: string, isAdmin = false): Promise<Problem> {
    if (dto.classRoomId) {
      await this.ensureClassOwner(dto.classRoomId, creatorId);
    } else if (!isAdmin) {
      throw new ForbiddenException('Only Admin can create global problems');
    }
    const slug = await this.buildUniqueSlug(dto.title);
    const supportedLanguages = dto.supportedLanguages ?? [];

    return this.prisma.$transaction(async (tx) => {
      const problem = await tx.problem.create({
        data: {
          title: dto.title,
          description: dto.description ?? null,
          statementMd: dto.statementMd ?? null,
          slug,
          difficulty: dto.difficulty ?? Difficulty.EASY,
          mode: dto.mode ?? ProblemMode.ALGO,
          timeLimitMs: dto.timeLimitMs ?? 1000,
          memoryLimitMb: dto.memoryLimitMb ?? 256,
          isPublished: dto.isPublished ?? true,
          visibility: dto.classRoomId ? ProblemVisibility.PRIVATE : (dto.visibility ?? ProblemVisibility.PUBLIC),
          supportedLanguages: supportedLanguages.length > 0 ? supportedLanguages : undefined,
          maxTestCases: dto.maxTestCases ?? 100,
          creatorId,
        },
      });

      if (dto.testCases && dto.testCases.length > 0) {
        await tx.testCase.createMany({
          data: dto.testCases.map((tc, index) => ({
            problemId: problem.id,
            orderIndex: index + 1,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden ?? false,
            weight: tc.weight ?? 1,
          })),
        });
      }

      // Create ClassAssignment automatically only if classRoomId is provided
      if (dto.classRoomId) {
        await tx.classAssignment.create({
          data: {
            classRoomId: dto.classRoomId,
            title: problem.title,
            description: problem.description,
            problemId: problem.id,
            publishedAt: new Date(),
            dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          },
        });
      }

      return problem;
    });
  }

  async findAll(query: { search?: string; page?: number; limit?: number; classRoomId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.ProblemWhereInput = query.classRoomId
      ? {
          assignments: {
            some: { classRoomId: query.classRoomId },
          },
        }
      : {
          isPublished: true,
          visibility: { not: 'PRIVATE' },
          assignments: { none: {} }, // Không hiện problem của lớp học ra ngoài
        };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.problem.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.problem.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findAllAdmin(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.ProblemWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { name: true, email: true } } },
      }),
      this.prisma.problem.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(problemId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: { orderBy: { orderIndex: 'asc' } },
        assignments: true,
      },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async update(
    problemId: string,
    dto: UpdateProblemDto,
    updaterId: string,
    isAdmin = false,
  ) {
    const existing = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        slug: true,
        creatorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Problem not found');
    }

    if (existing.creatorId !== updaterId && !isAdmin) {
      throw new ForbiddenException('Only Creator or Admin can update this problem');
    }

    const slug =
      dto.title && dto.title !== existing.title
        ? await this.buildUniqueSlug(dto.title)
        : existing.slug;

    return this.prisma.$transaction(async (tx) => {
      const data: any = {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.statementMd !== undefined ? { statementMd: dto.statementMd } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
        ...(dto.timeLimitMs !== undefined ? { timeLimitMs: dto.timeLimitMs } : {}),
        ...(dto.memoryLimitMb !== undefined ? { memoryLimitMb: dto.memoryLimitMb } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(dto.supportedLanguages !== undefined
          ? { supportedLanguages: dto.supportedLanguages }
          : {}),
        ...(dto.maxTestCases !== undefined ? { maxTestCases: dto.maxTestCases } : {}),
        slug,
      };

      const updatedProblem = await tx.problem.update({
        where: { id: problemId },
        data,
      });

      if (dto.testCases) {
        await tx.testCase.deleteMany({ where: { problemId } });
        if (dto.testCases.length > 0) {
          await tx.testCase.createMany({
            data: dto.testCases.map((tc, index) => ({
              problemId,
              orderIndex: index + 1,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden ?? false,
              weight: tc.weight ?? 1,
            })),
          });
        }
      }

      // Sync ClassAssignment details if changed
      if (dto.title !== undefined || dto.description !== undefined || dto.dueAt !== undefined) {
        await tx.classAssignment.updateMany({
          where: { problemId },
          data: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null } : {}),
          },
        });
      }

      return updatedProblem;
    });
  }

  async delete(problemId: string, userId: string, isAdmin = false) {
    const existing = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        slug: true,
        creatorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Problem not found');
    }

    if (existing.creatorId !== userId && !isAdmin) {
      throw new ForbiddenException('Only Creator or Admin can delete this problem');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.contestProblem.deleteMany({ where: { problemId } });
      await tx.classAssignment.deleteMany({ where: { problemId } });
      return tx.problem.delete({ where: { id: problemId } });
    });
  }

  private async buildUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.problem.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    return slug;
  }

  private async ensureClassOwner(classRoomId: string, userId: string) {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
      select: { ownerId: true },
    });

    if (!classRoom) {
      throw new NotFoundException('Class not found');
    }

    if (classRoom.ownerId !== userId) {
      throw new ForbiddenException('Only owner can do this action');
    }

    return classRoom;
  }
}

function slugify(value: string): string {
  const raw = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw.length > 0 ? raw : `problem-${randomBytes(4).toString('hex')}`;
}
