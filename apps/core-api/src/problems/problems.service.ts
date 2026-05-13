import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Difficulty, ProblemMode, ProblemVisibility, Prisma, Problem, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProblemDto, creatorId: string, role?: Role): Promise<Problem> {
    await this.ensureUserCanCreateProblemInClass(dto.classRoomId, creatorId, role);
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
          visibility: dto.visibility ?? ProblemVisibility.PUBLIC,
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

      // Create ClassAssignment automatically
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

      return problem;
    });
  }

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.ProblemWhereInput = {
      isPublished: true,
      visibility: { not: 'PRIVATE' },
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
    const where: Prisma.ProblemWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async update(problemId: string, dto: UpdateProblemDto, updaterId: string, role?: Role) {
    const existing = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        slug: true,
        creatorId: true,
        assignments: { select: { classRoomId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Problem not found');
    }

    if (!(await this.canManageProblem(existing, updaterId, role))) {
      throw new ForbiddenException('Only creator, class owner, or admin can update this problem');
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

  async delete(problemId: string, userId: string, role?: Role) {
    const existing = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        slug: true,
        creatorId: true,
        assignments: { select: { classRoomId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Problem not found');
    }

    if (!(await this.canManageProblem(existing, userId, role))) {
      throw new ForbiddenException('Only creator, class owner, or admin can delete this problem');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.contestProblem.deleteMany({ where: { problemId } });
      await tx.classAssignment.deleteMany({ where: { problemId } });
      return tx.problem.delete({ where: { id: problemId } });
    });
  }

  private async ensureUserCanCreateProblemInClass(
    classRoomId: string,
    userId: string,
    role?: Role,
  ): Promise<void> {
    if (role === Role.ADMIN) {
      await this.ensureClassExists(classRoomId);
      return;
    }

    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
      select: { id: true, ownerId: true },
    });

    if (!classRoom) {
      throw new NotFoundException('Class not found');
    }

    if (classRoom.ownerId === userId) {
      return;
    }

    const asOwnerEnrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        classRoomId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    if (!asOwnerEnrollment) {
      throw new ForbiddenException('Only the class owner can create problems for this class');
    }
  }

  /** Admin, creator, hoặc chủ lớp (ownerId / enrollment OWNER) của một lớp đang gán bài. */
  private async canManageProblem(
    existing: {
      creatorId: string | null;
      assignments: { classRoomId: string }[];
    },
    userId: string,
    role?: Role,
  ): Promise<boolean> {
    if (role === Role.ADMIN) {
      return true;
    }
    if (existing.creatorId === userId) {
      return true;
    }
    for (const a of existing.assignments) {
      if (await this.userIsClassOwnerForRoom(a.classRoomId, userId)) {
        return true;
      }
    }
    return false;
  }

  private async userIsClassOwnerForRoom(classRoomId: string, userId: string): Promise<boolean> {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
      select: { ownerId: true },
    });
    if (!classRoom) {
      return false;
    }
    if (classRoom.ownerId === userId) {
      return true;
    }
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        classRoomId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
    return Boolean(enrollment);
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

  private async ensureClassExists(classRoomId: string) {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
      select: { id: true },
    });

    if (!classRoom) {
      throw new NotFoundException('Class not found');
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
