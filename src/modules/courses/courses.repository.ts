import { db } from "../../prisma/db.js";
import type { CreateCourseData, UpdateCourseData } from "./courses.schema.js";

export async function findAll() {
  let query = db.orm.public.Courses;
  return query
    .orderBy((row) => row.id.asc())
    .include("Groups")
    .all();
}

export async function findById(id: number) {
  const course = await db.orm.public.Courses.where({ id })
    .include("Groups", (groups) =>
      groups
        .orderBy((group) => group.position.asc())
        .include("Lessons", (lessons) =>
          lessons
            .orderBy((lesson) => lesson.position.asc())
            .include("theory", (theory) =>
              theory
                .select("id", "title", "description")
                .include("technology", (technology) => technology.select("title")),
            )
            .include("practice", (practice) => practice.select("id", "title", "description"))
            .include("test", (test) => test.select("id", "title", "description")),
        ),
    )
    .first();
  if (course === null) return null;
  return {
    ...course,
    Groups: course.Groups.filter((group) => group.state !== "hidden").map((group) => ({
      ...group,
      Lessons: group.Lessons.filter((lesson) => !lesson.is_hidden),
    })),
  };
}

export async function findProgress(courseId: number, studentId: string) {
  const course = await db.orm.public.Courses.where({ id: courseId })
    .select("id")
    .include("Groups", (groups) =>
      groups
        .select("id", "position", "state")
        .orderBy((group) => group.position.asc())
        .include("Lessons", (lessons) =>
          lessons
            .select("id", "position", "is_hidden", "id_theory", "id_practice", "id_test")
            .orderBy((lesson) => lesson.position.asc())
            .include("Lesson_progress", (progress) =>
              progress
                .where({ id_student: studentId })
                .select("theory_completed_at", "practice_completed_at", "test_completed_at"),
            ),
        ),
    )
    .first();

  if (course === null) return null;

  // Первый урок доступен. Каждый следующий требует завершения всех предыдущих.
  let previousLessonsCompleted = true;

  const lessons = course.Groups.filter((group) => group.state !== "hidden").flatMap((group) =>
    group.Lessons.filter((lesson) => !lesson.is_hidden).map((lesson) => {
      // По модели для пары «ученик + урок» возможна только одна запись.
      const progress = lesson.Lesson_progress[0];

      const theoryCompletedAt = progress?.theory_completed_at ?? null;
      const practiceCompletedAt = progress?.practice_completed_at ?? null;
      const testCompletedAt = progress?.test_completed_at ?? null;

      // Часть, которой у урока нет, не требуется для его завершения.
      const isCompleted =
        (lesson.id_theory === null || theoryCompletedAt !== null) &&
        (lesson.id_practice === null || practiceCompletedAt !== null) &&
        (lesson.id_test === null || testCompletedAt !== null);

      const isAvailable = group.state === "open" && !lesson.is_hidden && previousLessonsCompleted;

      previousLessonsCompleted = previousLessonsCompleted && isCompleted;

      return {
        lessonId: lesson.id,
        theoryCompletedAt,
        practiceCompletedAt,
        testCompletedAt,
        isCompleted,
        isAvailable,
      };
    }),
  );

  return { courseId: course.id, lessons };
}

export async function findByUnique(title: string) {
  return db.orm.public.Courses.first({ title });
}

export async function create(data: CreateCourseData) {
  return db.orm.public.Courses.create(data);
}

export async function update(id: number, data: UpdateCourseData) {
  return db.orm.public.Courses.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Courses.where({ id }).delete();
}
