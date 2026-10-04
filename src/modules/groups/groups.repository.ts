import { db } from "../../prisma/db.js";
import type { CreateGroupData, UpdateGroupData } from "./groups.schema.js";

export type GroupState = "open" | "locked" | "hidden";

export async function findAll(courseId?: number) {
  if (courseId !== undefined) {
    return db.orm.public.Groups.where({ id_course: courseId })
      .orderBy((group) => group.position.asc())
      .include("course")
      .include("Lessons")
      .all();
  }
  return db.orm.public.Groups.orderBy((group) => group.position.asc())
    .include("course")
    .include("Lessons")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Groups.where({ id })
    .include("course")
    .include("Lessons")
    .first();
}

// Поиск группы на определенном месте в курсе
export async function findByCourseAndOrder(courseId: number, position: number) {
  return db.orm.public.Groups.first({ id_course: courseId, position });
}

// Проверяет, существует ли курс, к которому мы хотим привязать группу
// Пока тут поскольку нет модуля для курсов
export async function findCourseById(courseId: number) {
  const course = await db.orm.public.Courses.first({ id: courseId });
  return course !== null;
}

export async function create(data: CreateGroupData) {
  return db.orm.public.Groups.create(data);
}

export async function update(id: number, data: UpdateGroupData) {
  return db.orm.public.Groups.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Groups.where({ id }).delete();
}
