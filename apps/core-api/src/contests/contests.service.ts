import { BadRequestException, Injectable } from '@nestjs/common';
import { hashPassword } from '../common';
import { ContestStatus, ContestTestFeedbackPolicy, Prisma, Contest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';

@Injectable()
export class ContestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContestDto, creatorId: string): Promise<Contest> {
    const problems = dto.problems ?? [];
    const problemIds = problems.map((item) => item.problemId);
    if (problemIds.length > 0) {
      const existingProblems = await this.prisma.problem.findMany({
        where: { id: { in: problemIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProblems.map((item) => item.id));
      const missing = problemIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(`Problem không tồn tại: ${missing.join(', ')}`);
      }
    }

    const now = new Date();
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const status = determineContestStatus(startAt, endAt, now);
    const passwordHash = dto.password ? await hashPassword(dto.password) : null;

    return this.prisma.contest.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        slug: buildContestSlug(dto.title),
        passwordHash,
        startAt,
        endAt,
        status,
        testFeedbackPolicy: dto.testFeedbackPolicy ?? ContestTestFeedbackPolicy.SUMMARY_ONLY,
        maxSubmissionsPerProblem: dto.maxSubmissionsPerProblem ?? null,
        createdById: creatorId,
        problems: {
          create: problems.map((problem, index) => ({
            problemId: problem.problemId,
            orderIndex: problem.orderIndex ?? index,
            points: problem.points ?? 100,
            timeLimitMsOverride: problem.timeLimitMsOverride ?? null,
            memoryLimitMbOverride: problem.memoryLimitMbOverride ?? null,
          })),
        },
      },
    });
  }

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.ContestWhereInput = {
      status: { not: 'DRAFT' },
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
      this.prisma.contest.findMany({ where, skip, take: limit, orderBy: { startAt: 'desc' } }),
      this.prisma.contest.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { include: { problem: true } },
      },
    });
    if (!contest) {
      throw new BadRequestException('Contest không tồn tại');
    }
    const { passwordHash, ...result } = contest;
    return result;
  }

  async update(contestId: string, dto: UpdateContestDto, updaterId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: true },
    });
    if (!contest) {
      throw new BadRequestException('Contest không tồn tại');
    }

    if (dto.problems && dto.problems.length > 0) {
      const problemIds = dto.problems
        .map((item) => item.problemId)
        .filter((id): id is string => Boolean(id));
      const existingProblems = await this.prisma.problem.findMany({
        where: { id: { in: problemIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProblems.map((item) => item.id));
      const missing = problemIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(`Problem không tồn tại: ${missing.join(', ')}`);
      }
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : contest.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : contest.endAt;
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const status = determineContestStatus(startAt, endAt, new Date());
    const passwordHash = dto.password ? await hashPassword(dto.password) : contest.passwordHash;

    return this.prisma.$transaction(async (tx) => {
      const updatedContest = await tx.contest.update({
        where: { id: contestId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.startAt !== undefined ? { startAt } : {}),
          ...(dto.endAt !== undefined ? { endAt } : {}),
          ...(dto.testFeedbackPolicy !== undefined
            ? { testFeedbackPolicy: dto.testFeedbackPolicy }
            : {}),
          ...(dto.maxSubmissionsPerProblem !== undefined
            ? { maxSubmissionsPerProblem: dto.maxSubmissionsPerProblem }
            : {}),
          ...(dto.password !== undefined ? { passwordHash } : {}),
          status,
        },
      });

      if (dto.problems) {
        await tx.contestProblem.deleteMany({ where: { contestId } });
        if (dto.problems.length > 0) {
          await tx.contestProblem.createMany({
            data: dto.problems.map((item, index) => ({
              contestId,
              problemId: item.problemId!,
              orderIndex: item.orderIndex ?? index,
              points: item.points ?? 100,
              timeLimitMsOverride: item.timeLimitMsOverride ?? null,
              memoryLimitMbOverride: item.memoryLimitMbOverride ?? null,
            })),
          });
        }
      }

      return updatedContest;
    });
  }

  async delete(contestId: string) {
    await this.findById(contestId);
    return this.prisma.contest.delete({ where: { id: contestId } });
  }
}

function determineContestStatus(startAt: Date, endAt: Date, now: Date): ContestStatus {
  if (endAt <= now) return ContestStatus.ENDED;
  if (startAt <= now && endAt > now) return ContestStatus.RUNNING;
  return ContestStatus.PUBLISHED;
}

function buildContestSlug(value: string): string {
  const raw = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw.length > 0 ? raw : `contest-${Math.random().toString(36).slice(2, 10)}`;
}
