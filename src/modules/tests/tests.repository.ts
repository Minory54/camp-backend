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
        .include("Question_options", (options) =>
          options
            .select("id", "id_question", "position", "title")
            .orderBy((option) => option.position.asc()),
        ),
    )
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Tests.where({ id })
    .include("Test_questions", (test_questions) =>
      test_questions
        .orderBy((test_questions) => test_questions.position.asc())
        .include("Question_options", (options) =>
          options
            .select("id", "id_question", "position", "title")
            .orderBy((option) => option.position.asc()),
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

export async function findLessonsByTest(id_test: number) {
  return db.orm.public.Lessons.where({ id_test }).limit(2).all();
}

export async function studentExists(id: string) {
  return (await db.orm.public.Students.first({ id })) !== null;
}

export async function findLessonProgress(id_student: string, id_lesson: number) {
  return db.orm.public.Lesson_progress.first({ id_student, id_lesson });
}

export async function recordAnswer(
  id_student: string,
  id_question: number,
  id_test: number,
  id_lesson: number,
  is_correct: boolean,
) {
  return db.transaction(async (tx) => {
    // Serialise submissions from one student so simultaneous correct answers
    // cannot both miss the other's newly saved result.
    const lock = db.raw.sql`
      SELECT id FROM students WHERE id = ${id_student}::uuid FOR NO KEY UPDATE
    `
      .returnsRow({ id: "pg/uuid@1" })
      .build();
    let studentExists = false;
    for await (const row of tx.query(lock)) studentExists = Boolean(row.id);
    if (!studentExists) throw new Error("Student disappeared while saving an answer");

    await tx.execute(
      db.raw.sql`
      INSERT INTO test_answers (id_student, id_question, is_correct)
      VALUES (${id_student}::uuid, ${id_question}, ${is_correct})
      ON CONFLICT (id_student, id_question)
      DO UPDATE SET is_correct = test_answers.is_correct OR EXCLUDED.is_correct
    `
        .affectedCount()
        .build(),
    );

    const check = db.raw.sql`
      SELECT EXISTS (
        SELECT 1 FROM test_questions WHERE id_test = ${id_test}
      ) AND NOT EXISTS (
        SELECT 1 FROM test_questions AS question
        WHERE question.id_test = ${id_test}
          AND NOT EXISTS (
            SELECT 1 FROM test_answers AS answer
            WHERE answer.id_question = question.id
              AND answer.id_student = ${id_student}::uuid
              AND answer.is_correct = TRUE
          )
      ) AS completed
    `
      .returnsRow({ completed: "pg/bool@1" })
      .build();
    let allCorrect = false;
    for await (const row of tx.query(check)) allCorrect = row.completed;

    if (allCorrect) {
      await tx.execute(
        db.raw.sql`
        INSERT INTO lesson_progress (id_student, id_lesson, test_completed_at)
        VALUES (${id_student}::uuid, ${id_lesson}, NOW())
        ON CONFLICT (id_student, id_lesson)
        DO UPDATE SET test_completed_at = EXCLUDED.test_completed_at
        WHERE lesson_progress.test_completed_at IS NULL
      `
          .affectedCount()
          .build(),
      );
    }
    const progress = await tx.orm.public.Lesson_progress.first({ id_student, id_lesson });
    return progress?.test_completed_at != null;
  });
}

export async function findAnswers(id_test: number, id_student: string) {
  const questions = await db.orm.public.Test_questions.where({ id_test })
    .orderBy((question) => question.position.asc())
    .select("id")
    .all();
  const answers = await db.orm.public.Test_answers.where({ id_student })
    .select("id_question", "is_correct")
    .all();
  const byQuestion = new Map(answers.map((answer) => [answer.id_question, answer.is_correct]));
  return questions.map((question) => ({
    id_question: question.id,
    is_correct: byQuestion.get(question.id) ?? false,
  }));
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
