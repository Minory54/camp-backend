import { db } from "../../prisma/db.js";
import type {
  CreateLessonProgressData,
  UpdateLessonProgressData,
  LessonProgressQuery,
} from "./lesson_progress.schema.js";

export async function findAll(filters: LessonProgressQuery = {}) {
  let query = db.orm.public.Lesson_progress;
  if (filters.studentId !== undefined)
    query = query.where({ id_student: filters.studentId });
  if (filters.lessonId !== undefined)
    query = query.where({ id_lesson: filters.lessonId });
  return query
    .orderBy((row) => row.id.asc())
    .include("student")
    .include("lesson")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Lesson_progress.where({ id })
    .include("student")
    .include("lesson")
    .first();
}

export async function findByUnique(id_student: string, id_lesson: number) {
  return db.orm.public.Lesson_progress.first({ id_student, id_lesson });
}

export async function idStudentExists(id: string) {
  return (await db.orm.public.Students.first({ id })) !== null;
}

export async function idLessonExists(id: number) {
  return (await db.orm.public.Lessons.first({ id })) !== null;
}

export async function create(data: CreateLessonProgressData) {
  return db.orm.public.Lesson_progress.create(data);
}

export async function update(id: number, data: UpdateLessonProgressData) {
  return db.orm.public.Lesson_progress.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Lesson_progress.where({ id }).delete();
}
