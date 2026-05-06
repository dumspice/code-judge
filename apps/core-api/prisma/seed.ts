/**
 * Seed dữ liệu cố định cho dev/test (id/email có tiền tố hoặc hậu tố seed).
 *
 * Chạy: `npm run prisma:seed -w @code-judge/core-api` (hoặc `npx prisma db seed` trong app core-api).
 * Yêu cầu: `DATABASE_URL`, Postgres đã migrate.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for prisma seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

const SEED_PASSWORD = 'Secret12!';
const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10);

/** Id cố định để Postman / test có thể tham chiếu */
const SEED_IDS = {
  admin: 'seed-user-admin',
  instructor: 'seed-user-instructor',
  student: 'seed-user-student',
  org: 'seed-org-demo',
  problemAlgo: 'seed-problem-algo',
  problemProject: 'seed-problem-project',
  contest: 'seed-contest-winter',
  classRoom: 'seed-class-cpp',
  tagDp: 'seed-tag-dp',
  tagArray: 'seed-tag-array',
  /** Id cố định để Postman `bind-object-key` / presign không cần copy từ log */
  golden: 'seed-golden-001',
  aiJob: 'seed-ai-job-001',
  reportExport: 'seed-export-001',
} as const;

async function wipeSeedArtifacts(): Promise<void> {
  const contestId = SEED_IDS.contest;
  const probIds = [SEED_IDS.problemAlgo, SEED_IDS.problemProject];
  const seedUserIds = [SEED_IDS.admin, SEED_IDS.instructor, SEED_IDS.student];

  await prisma.reportExport.deleteMany({
    where: { OR: [{ id: SEED_IDS.reportExport }, { contestId }] },
  });
  await prisma.contestParticipant.deleteMany({ where: { contestId } });
  await prisma.submission.deleteMany({
    where: {
      OR: [{ contestId }, { problemId: { in: probIds } }, { userId: { in: seedUserIds } }],
    },
  });
  await prisma.contestProblem.deleteMany({ where: { contestId } });
  await prisma.contest.deleteMany({ where: { id: contestId } });

  await prisma.goldenSolution.deleteMany({
    where: { OR: [{ id: SEED_IDS.golden }, { problemId: SEED_IDS.problemAlgo }] },
  });
  await prisma.aiGenerationJob.deleteMany({
    where: { OR: [{ id: SEED_IDS.aiJob }, { problemId: SEED_IDS.problemAlgo }] },
  });
  await prisma.testCase.deleteMany({ where: { problemId: SEED_IDS.problemAlgo } });

  await prisma.problemTag.deleteMany({ where: { problemId: { in: probIds } } });
  await prisma.tag.deleteMany({ where: { id: { startsWith: 'seed-tag-' } } });
  await prisma.problem.deleteMany({ where: { id: { in: probIds } } });

  await prisma.classEnrollment.deleteMany({ where: { classRoomId: SEED_IDS.classRoom } });
  await prisma.classRoom.deleteMany({ where: { id: SEED_IDS.classRoom } });

  await prisma.organizationMembership.deleteMany({ where: { organizationId: SEED_IDS.org } });
  await prisma.organization.deleteMany({ where: { id: SEED_IDS.org } });

  await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
}

async function seed(): Promise<void> {
  await wipeSeedArtifacts();

  await prisma.user.createMany({
    data: [
      {
        id: SEED_IDS.admin,
        name: 'Seed Admin',
        email: 'admin@seed.local',
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        instructorVerification: 'NONE',
      },
      {
        id: SEED_IDS.instructor,
        name: 'Seed Instructor',
        email: 'instructor@seed.local',
        passwordHash,
        role: 'INSTRUCTOR',
        emailVerified: true,
        instructorVerification: 'APPROVED',
      },
      {
        id: SEED_IDS.student,
        name: 'Seed Student',
        email: 'student@seed.local',
        passwordHash,
        role: 'STUDENT',
        emailVerified: true,
        instructorVerification: 'NONE',
      },
    ],
  });

  await prisma.organization.create({
    data: {
      id: SEED_IDS.org,
      name: 'Demo School (Seed)',
      slug: 'demo-school-seed',
      isActive: true,
    },
  });

  await prisma.organizationMembership.create({
    data: {
      organizationId: SEED_IDS.org,
      userId: SEED_IDS.instructor,
      role: 'ORG_INSTRUCTOR',
    },
  });

  const now = new Date();
  const startAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.problem.createMany({
    data: [
      {
        id: SEED_IDS.problemAlgo,
        slug: 'two-sum-seed',
        title: 'Two Sum (Seed)',
        description: 'Tìm hai số có tổng bằng target — dữ liệu seed cho judge/API.',
        statementMd: '## Yêu cầu\nCho mảng số nguyên và target...',
        difficulty: 'EASY',
        mode: 'ALGO',
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        isPublished: true,
        visibility: 'PUBLIC',
        creatorId: SEED_IDS.instructor,
        supportedLanguages: ['python3', 'cpp17'],
        maxTestCases: 50,
      },
      {
        id: SEED_IDS.problemProject,
        slug: 'hello-cli-seed',
        title: 'Hello CLI (Seed)',
        description: 'Bài PROJECT seed — stub.',
        statementMd: 'In ra `Hello` khi chạy chương trình.',
        difficulty: 'EASY',
        mode: 'PROJECT',
        timeLimitMs: 5000,
        memoryLimitMb: 512,
        isPublished: true,
        visibility: 'PUBLIC',
        creatorId: SEED_IDS.instructor,
        supportedLanguages: [],
        maxTestCases: 10,
      },
    ],
  });

  await prisma.testCase.createMany({
    data: [
      {
        problemId: SEED_IDS.problemAlgo,
        orderIndex: 0,
        input: '1\n2\n',
        expectedOutput: '3\n',
        isHidden: false,
        weight: 1,
      },
      {
        problemId: SEED_IDS.problemAlgo,
        orderIndex: 1,
        input: '10\n20\n',
        expectedOutput: '30\n',
        isHidden: true,
        weight: 2,
      },
    ],
  });

  await prisma.goldenSolution.create({
    data: {
      id: SEED_IDS.golden,
      problemId: SEED_IDS.problemAlgo,
      language: 'python3',
      sourceCode: 'print(int(input()) + int(input()))',
      isPrimary: true,
      createdById: SEED_IDS.instructor,
    },
  });

  await prisma.aiGenerationJob.create({
    data: {
      id: SEED_IDS.aiJob,
      problemId: SEED_IDS.problemAlgo,
      createdById: SEED_IDS.instructor,
      status: 'PENDING',
      promptVersion: 'seed-v1',
      structuredOutput: {
        note: 'Seed job — thay bằng output AI thật khi chạy pipeline.',
      },
    },
  });

  await prisma.tag.createMany({
    data: [
      { id: SEED_IDS.tagDp, slug: 'dynamic-programming-seed', name: 'Dynamic Programming (Seed)' },
      { id: SEED_IDS.tagArray, slug: 'array-seed', name: 'Array (Seed)' },
    ],
  });

  await prisma.problemTag.createMany({
    data: [
      { problemId: SEED_IDS.problemAlgo, tagId: SEED_IDS.tagDp },
      { problemId: SEED_IDS.problemAlgo, tagId: SEED_IDS.tagArray },
    ],
  });

  await prisma.contest.create({
    data: {
      id: SEED_IDS.contest,
      title: 'Winter Seed Contest',
      description: 'Contest seed để test export / submission contest.',
      slug: 'winter-seed-2026',
      startAt,
      endAt,
      status: 'DRAFT',
      testFeedbackPolicy: 'SUMMARY_ONLY',
      createdById: SEED_IDS.instructor,
    },
  });

  await prisma.contestProblem.create({
    data: {
      contestId: SEED_IDS.contest,
      problemId: SEED_IDS.problemAlgo,
      orderIndex: 0,
      points: 100,
    },
  });

  await prisma.reportExport.create({
    data: {
      id: SEED_IDS.reportExport,
      contestId: SEED_IDS.contest,
      requestedById: SEED_IDS.instructor,
      format: 'XLSX',
      status: 'PENDING',
    },
  });

  await prisma.classRoom.create({
    data: {
      id: SEED_IDS.classRoom,
      ownerId: SEED_IDS.instructor,
      organizationId: SEED_IDS.org,
      name: 'CPP 101 (Seed)',
      description: 'Lớp seed để test enrollment.',
      classCode: 'SEEDCPP2026',
      isActive: true,
    },
  });

  await prisma.classEnrollment.create({
    data: {
      classRoomId: SEED_IDS.classRoom,
      userId: SEED_IDS.student,
      status: 'ACTIVE',
    },
  });
}

async function main(): Promise<void> {
  console.info('[prisma seed] Starting…');
  await seed();
  console.info('[prisma seed] Done.');
  console.info('');
  console.info('Tài khoản seed (mật khẩu giống nhau):', SEED_PASSWORD);
  console.info('  admin@seed.local        → ADMIN');
  console.info('  instructor@seed.local   → INSTRUCTOR');
  console.info('  student@seed.local      → STUDENT');
  console.info('');
  console.info('Id cố định (Postman / test):');
  console.info('  users:', SEED_IDS.admin, SEED_IDS.instructor, SEED_IDS.student);
  console.info('  problem ALGO:', SEED_IDS.problemAlgo, '| PROJECT:', SEED_IDS.problemProject);
  console.info('  contest:', SEED_IDS.contest, '| class:', SEED_IDS.classRoom, '| join code: SEEDCPP2026');
  console.info('  golden:', SEED_IDS.golden, '| aiJob:', SEED_IDS.aiJob, '| export:', SEED_IDS.reportExport);
}

main()
  .catch((e) => {
    console.error('[prisma seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
