import { db } from "../../prisma/db.js";
import type { CreateQuestionData, UpdateQuestionData } from "./questions.schema.js";

export async function findAll(parentId?: number) {
  const collection = db.orm.public.Test_questions;
  if (parentId !== undefined) {
    return collection
      .where({ id_test: parentId })
      .orderBy((row) => row.position.asc())
      .include("code_language")
      .include("Question_options", (options) =>
        options
          .select("id", "id_question", "position", "title")
          .orderBy((option) => option.position.asc()),
      )
      .all();
  }
  return collection
    .orderBy([(row) => row.id_test.asc(), (row) => row.position.asc()])
    .include("code_language")
    .include("Question_options", (options) =>
      options
        .select("id", "id_question", "position", "title")
        .orderBy((option) => option.position.asc()),
    )
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Test_questions.where({ id })
    .include("code_language")
    .include("Question_options")
    .first();
}

export async function findByParentAndPosition(parentId: number, position: number) {
  return db.orm.public.Test_questions.first({ id_test: parentId, position });
}

export async function parentExists(id: number) {
  return (await db.orm.public.Tests.first({ id })) !== null;
}

export async function create(data: CreateQuestionData) {
  return db.orm.public.Test_questions.create(data);
}

export async function update(id: number, data: UpdateQuestionData) {
  return db.orm.public.Test_questions.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Test_questions.where({ id }).delete();
}

export async function codeLanguageExists(id: number) {
  return (await db.orm.public.Code_languages.first({ id })) !== null;
}
