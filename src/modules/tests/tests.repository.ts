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

export async function create(data: CreateTestData) {
  return db.orm.public.Tests.create(data);
}

export async function update(id: number, data: UpdateTestData) {
  return db.orm.public.Tests.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Tests.where({ id }).delete();
}
