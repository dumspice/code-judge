import { Injectable, ForbiddenException } from '@nestjs/common';
import { ProblemVisibility, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

/**
 * ProblemVisibilityService — enforces visibility rules:
 * - Class problems (has classRoomId) → ALWAYS PRIVATE
 * - Admin problems → can set PRIVATE, PUBLIC, CONTEST_ONLY
 * - Class owners cannot change class problem visibility to PUBLIC/CONTEST_ONLY
 */
@Injectable()
export class ProblemVisibilityService {
  /**
   * For creation: override visibility based on context.
   * @param dto The create problem DTO
   * @param classRoomId Class ID (if creating in class context)
   * @returns Corrected visibility value
   */
  getVisibilityForCreate(
    dto: CreateProblemDto,
    classRoomId: string | undefined,
  ): ProblemVisibility {
    // If creating in a class, always force PRIVATE
    if (classRoomId) {
      return ProblemVisibility.PRIVATE;
    }

    // Admin problems: use DTO value or default to PUBLIC
    return (dto.visibility ?? ProblemVisibility.PUBLIC) as ProblemVisibility;
  }

  /**
   * For update: enforce visibility rules based on context.
   * @param problemVisibility Existing problem visibility
   * @param dtoVisibility Requested visibility from DTO
   * @param classRoomIds Class IDs associated with this problem (if any)
   * @param updaterRole Role of the updater
   * @returns Corrected visibility value
   * @throws ForbiddenException if class owner attempts to make class problem PUBLIC/CONTEST_ONLY
   */
  getVisibilityForUpdate(
    problemVisibility: ProblemVisibility,
    dtoVisibility: ProblemVisibility | undefined,
    classRoomIds: string[],
    updaterRole: Role | undefined,
  ): ProblemVisibility {
    // If no visibility change requested, keep existing
    if (dtoVisibility === undefined) {
      return problemVisibility;
    }

    // If this is a class problem
    if (classRoomIds.length > 0) {
      // Only admin can change class problem visibility away from PRIVATE
      if (updaterRole !== Role.ADMIN && dtoVisibility !== ProblemVisibility.PRIVATE) {
        throw new ForbiddenException(
          'Class owners cannot change visibility of class problems to PUBLIC or CONTEST_ONLY. ' +
            'Only admins can modify the visibility of classroom-assigned problems.',
        );
      }
      // Even if admin tries to change, ensure it stays PRIVATE
      return ProblemVisibility.PRIVATE;
    }

    // For admin problems (no class assignments), allow any visibility
    return dtoVisibility;
  }

  /**
   * Validate that public problem bank filters only show PUBLIC problems.
   * Used to ensure findAll (public endpoint) only returns PUBLIC visibility.
   */
  getPublicProblemBankVisibilityFilter(): Prisma.ProblemWhereInput {
    return { visibility: ProblemVisibility.PUBLIC };
  }
}
