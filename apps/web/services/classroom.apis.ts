import { apiFetch } from './auth.apis';

export interface Classroom {
  id: string;
  name: string;
  description?: string | null;
  academicYear?: string | null;
  classCode: string;
  isActive: boolean;
  owner: {
    id: string;
    name: string;
    image?: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  assignments: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassroomDto {
  name: string;
  description?: string;
  academicYear?: string;
}

export interface UpdateClassroomDto {
  name?: string;
  description?: string;
  academicYear?: string;
}

export interface JoinClassroomDto {
  classCode: string;
}

export interface MyClassroomItem {
  role: 'OWNER' | 'MEMBER';

  classRoom: {
    id: string;
    name: string;
    academicYear?: string | null;
    classCode: string;

    owner: {
      id: string;
      name: string;
      image?: string | null;
    };
  };
}

export interface ClassroomPeopleResponse {
  ownerId: string;

  teachers: {
    id: string;
    name: string;
    image?: string | null;
  }[];

  students: {
    id: string;
    name: string;
    image?: string | null;
  }[];
}

// CREATE CLASSROOM
export async function createClassroom(dto: CreateClassroomDto): Promise<Classroom> {
  return apiFetch<Classroom>('/classroom', {
    method: 'POST',
    body: dto,
  });
}

// GET MY CLASSROOMS
export async function getMyClassrooms(): Promise<MyClassroomItem[]> {
  return apiFetch<MyClassroomItem[]>('/classroom/me');
}

// GET CLASSROOM DETAIL
export async function getClassroomDetail(id: string): Promise<Classroom> {
  return apiFetch<Classroom>(`/classroom/${id}`);
}

// GET CLASSROOM PEOPLE
export function getClassroomPeople(classRoomId: string) {
  return apiFetch<ClassroomPeopleResponse>(`/classroom/${classRoomId}/people`);
}

// UPDATE CLASSROOM
export async function updateClassroom(id: string, dto: UpdateClassroomDto): Promise<Classroom> {
  return apiFetch<Classroom>(`/classroom/${id}`, {
    method: 'PATCH',
    body: dto,
  });
}

// DELETE CLASSROOM (SOFT DELETE)
export async function deleteClassroom(id: string): Promise<void> {
  return apiFetch<void>(`/classroom/${id}`, {
    method: 'DELETE',
  });
}

// JOIN CLASSROOM
export async function joinClassroom(dto: JoinClassroomDto): Promise<{
  id: string;
  classRoomId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING' | 'REMOVED';
  joinedAt: string | null;
}> {
  return apiFetch(`/classroom/join`, {
    method: 'POST',
    body: dto,
  });
}
