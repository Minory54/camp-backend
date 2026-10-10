import { db } from "../../prisma/db.js";
import type { CreateLessonProgressData, LessonProgressQuery } from "./lesson_progress.schema.js";

export async function findAll(filters: LessonProgressQuery = {}) {
  let query = db.orm.public.Lesson_progress;
  if (filters.studentId !== undefined) query = query.where({ id_student: filters.studentId });
  if (filters.lessonId !== undefined) query = query.where({ id_lesson: filters.lessonId });
  return query
    .orderBy((row) => row.id.asc())
    .include("student", (student) =>
      student.select("id", "display_code", "label", "created_at", "updated_at"),
    )
    .include("lesson")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Lesson_progress.where({ id })
    .include("student", (student) =>
      student.select("id", "display_code", "label", "created_at", "updated_at"),
    )
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
  return db.orm.public.Lesson_progress.create({
    id_student: data.id_student,
    id_lesson: data.id_lesson,
    theory_completed_at: null,
    practice_completed_at: null,
    test_completed_at: null,
  });
}

export async function markTheoryOpened(id_student: string, id_lesson: number) {
  const plan = db.raw.sql`
    INSERT INTO lesson_progress (id_student, id_lesson, theory_completed_at)
    VALUES (${id_student}::uuid, ${id_lesson}, NOW())
    ON CONFLICT (id_student, id_lesson)
    DO UPDATE SET theory_completed_at = EXCLUDED.theory_completed_at
    WHERE lesson_progress.theory_completed_at IS NULL
  `
    .affectedCount()
    .build();
  await db.runtime().execute(plan);
}

// export async function update(id: number, data: UpdateLessonProgressData) {
//   return db.orm.public.Lesson_progress.where({ id }).update(data);
// }

export async function remove(id: number) {
  return db.orm.public.Lesson_progress.where({ id }).delete();
}
