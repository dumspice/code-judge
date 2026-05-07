import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { generateClassCode } from './utils/generate-class-code';

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE CLASSROOM
  async create(dto: CreateClassroomDto, userId: string) {
    // generate unique class code
    let classCode = generateClassCode();

    let exists = await this.prisma.classRoom.findUnique({
      where: { classCode },
    });

    while (exists) {
      classCode = generateClassCode();
      exists = await this.prisma.classRoom.findUnique({
        where: { classCode },
      });
    }

    // create classroom
    const classroom = await this.prisma.classRoom.create({
      data: {
        name: dto.name,
        description: dto.description,
        academicYear: dto.academicYear,
        classCode,
        ownerId: userId,
        isActive: true,
      },
    });

    // auto enroll owner
    await this.prisma.classEnrollment.create({
      data: {
        classRoomId: classroom.id,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });

    return classroom;
  }

  // GET MY CLASSES
  async getMyClasses(userId: string) {
    return this.prisma.classEnrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },

      select: {
        role: true,

        classRoom: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            classCode: true,
            createdAt: true,

            owner: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  // GET CLASS DETAIL
  async getDetail(classRoomId: string, userId: string) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        classRoomId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not in this class');
    }

    return this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
      include: {
        owner: true,
        enrollments: {
          include: { user: true },
        },
        assignments: true,
      },
    });
  }

  // UPDATE CLASSROOM (OWNER ONLY)
  async update(classRoomId: string, dto: UpdateClassroomDto, userId: string) {
    const classroom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    if (classroom.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update');
    }

    return this.prisma.classRoom.update({
      where: { id: classRoomId },
      data: dto,
    });
  }

  // DELETE CLASSROOM (SOFT DELETE)
  async remove(classRoomId: string, userId: string) {
    const classroom = await this.prisma.classRoom.findUnique({
      where: { id: classRoomId },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    if (classroom.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete');
    }

    return this.prisma.classRoom.update({
      where: { id: classRoomId },
      data: {
        isActive: false,
      },
    });
  }

  // JOIN CLASSROOM
  async join(dto: JoinClassroomDto, userId: string) {
    const classroom = await this.prisma.classRoom.findUnique({
      where: { classCode: dto.classCode },
    });

    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Class not found');
    }

    const existing = await this.prisma.classEnrollment.findUnique({
      where: {
        classRoomId_userId: {
          classRoomId: classroom.id,
          userId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.classEnrollment.create({
      data: {
        classRoomId: classroom.id,
        userId,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });
  }
}
