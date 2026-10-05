import { db } from "../../prisma/db.js";
import type { CreateTestData, UpdateTestData } from "./tests.schema.js";

export async function findAll() {
  const collection = db.orm.public.Tests;
  return collection
    .orderBy((row) => row.id.asc())
    .include("Test_questions", (test_questions) =>
      test_questions
        .orderBy((test_questions) => test_questions.position.asc())
        .include("code_language")
        .include("Question_options", (question_options) =>
          question_options.orderBy((question_options) => question_options.position.asc()),
        ),
    )
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Tests.where({ id })
    .include("Test_questions", (test_questions) =>
      test_questions
        .orderBy((test_questions) => test_questions.position.asc())
        .include("Question_options", (question_options) =>
          question_options.orderBy((question_options) => question_options.position.asc()),
        ),
    )
    .first();
}

export async function findQuestionForAnswer(id: number) {
  return db.orm.public.Test_questions.where({ id })
    .include("test")
    .include("Question_options")
    .first();
}

export async function findLastQuestion(id_test: number) {
  return db.orm.public.Test_questions.where({ id_test })
    .orderBy((question) => question.position.desc())
    .first();
}

export async function findLessonsByTest(id_test: number) {
  return db.orm.public.Lessons.where({ id_test }).limit(2).all();
}

export async function studentExists(id: string) {
  return (await db.orm.public.Students.first({ id })) !== null;
}

export async function findLessonProgress(id_student: string, id_lesson: number) {
  return db.orm.public.Lesson_progress.first({ id_student, id_lesson });
}

export async function completeTest(
  id_student: string,
  id_lesson: number,
  completedAt: string,
) {
  return db.orm.public.Lesson_progress.where({ id_student, id_lesson })
    .where((progress) => progress.test_completed_at.isNull())
    .update({ test_completed_at: completedAt });
}

export async function create(data: CreateTestData) {
  return db.orm.public.Tests.create(data);
}

export async function update(id: number, data: UpdateTestData) {
  return db.orm.public.Tests.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Tests.where({ id }).delete();
}
